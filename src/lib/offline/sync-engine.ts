import { ticketsService } from "../../services/tickets.service";
import { getOfflineDB } from "./db";
import {
  listPendingTickets,
  listMediaForTicket,
  updateTicketStatus,
  updateMediaStatus,
} from "./outbox";

let isSyncing = false;
type SyncListener = () => void;
const listeners = new Set<SyncListener>();

export function onSyncChange(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

async function syncSingleTicket(localId: string): Promise<void> {
  const db = await getOfflineDB();
  const ticket = await db.get("outbox_tickets", localId);
  if (!ticket || ticket.status === "synced") return;

  await updateTicketStatus(localId, { status: "syncing" });
  notify();

  try {
    // 1. Cria o chamado no servidor
    const created = await ticketsService.create(ticket.payload);
    if (!created?.id) throw new Error("Servidor não retornou ID do chamado.");

    // Mapeia partCode -> id real da peça, criada agora no servidor,
    // para conseguir vincular corretamente cada foto à peça certa.
    const partIdByCode = new Map<string, string>();
    for (const p of created.parts ?? []) {
      partIdByCode.set(p.partCode, p.id);
    }

    // 2. Sobe cada mídia pendente vinculada a esse ticket local
    const mediaItems = await listMediaForTicket(localId);
    for (const media of mediaItems) {
      if (media.status === "synced") continue;
      try {
        const file = new File([media.blob], `${media.id}.bin`, {
          type: media.blob.type,
        });
        const uploaded = await ticketsService.uploadFileToR2(file, created.id!);
        if (!uploaded) throw new Error("Falha no upload para o R2.");

        const ticketPartId = media.partCode
          ? partIdByCode.get(media.partCode)
          : undefined;

        await ticketsService.confirmMedia({
          ticketId: created.id!,
          objectKey: uploaded.objectKey,
          mediaType: media.mediaType,
          capturedAt: media.capturedAt,
          latitude: media.latitude,
          longitude: media.longitude,
          ticketPartId,
        });

        await updateMediaStatus(media.id, { status: "synced" });
      } catch (mediaErr) {
        // Mídia individual falhando não derruba o ticket já criado —
        // fica marcada com erro pra retry, mas o chamado em si está salvo.
        await updateMediaStatus(media.id, {
          status: "error",
          errorMessage:
            mediaErr instanceof Error ? mediaErr.message : "Falha no upload.",
        });
      }
    }

    await updateTicketStatus(localId, {
      status: "synced",
      serverId: created.id,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    await updateTicketStatus(localId, {
      status: "error",
      errorMessage:
        err instanceof Error ? err.message : "Falha ao sincronizar.",
    });
  } finally {
    notify();
  }
}

export async function runSync(): Promise<void> {
  if (isSyncing) return; // evita corrida de duas sincronizações simultâneas
  if (!navigator.onLine) return;

  isSyncing = true;
  notify();
  try {
    const pending = await listPendingTickets();
    // Processa em ordem de criação (fila), um de cada vez — mais lento,
    // mas evita sobrecarregar a rede do montador em campo (3G/4G fraco).
    for (const ticket of pending) {
      await syncSingleTicket(ticket.localId);
    }
  } finally {
    isSyncing = false;
    notify();
  }
}

export function isSyncRunning(): boolean {
  return isSyncing;
}

// Permite ao montador forçar nova tentativa de um chamado específico
// que ficou com status "error" (ex: falha de validação temporária, R2 fora do ar).
export async function retryTicket(localId: string): Promise<void> {
  const { updateTicketStatus } = await import("./outbox");
  await updateTicketStatus(localId, {
    status: "pending",
    errorMessage: undefined,
  });
  await syncSingleTicket(localId);
}

// Dispara automaticamente ao voltar a conexão
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void runSync();
  });
}
