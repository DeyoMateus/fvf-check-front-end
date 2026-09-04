import { getOfflineDB, type OutboxTicket, type OutboxMedia } from "./db";
import type {
  CreateTicketPayload,
  MediaType,
} from "../../services/tickets.service";

// Função utilitária usando a Web API nativa
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}

export async function enqueueTicket(
  ownerId: string,
  payload: CreateTicketPayload,
): Promise<OutboxTicket> {
  const db = await getOfflineDB();
  const record: OutboxTicket = {
    localId: generateUUID(),
    ownerId,
    status: "pending",
    serverId: null,
    payload,
    createdAt: new Date().toISOString(),
  };
  await db.add("outbox_tickets", record);
  return record;
}

export async function enqueueMedia(
  ownerId: string,
  ticketLocalId: string,
  blob: Blob,
  mediaType: MediaType,
  meta: { capturedAt: string; latitude?: number; longitude?: number },
): Promise<OutboxMedia> {
  const db = await getOfflineDB();
  const record: OutboxMedia = {
    id: generateUUID(),
    ticketLocalId,
    ownerId,
    blob,
    mediaType,
    status: "pending",
    ...meta,
  };
  await db.add("outbox_media", record);
  return record;
}

export async function listOwnTickets(ownerId: string): Promise<OutboxTicket[]> {
  const db = await getOfflineDB();
  const all = await db.getAllFromIndex("outbox_tickets", "by-owner", ownerId);
  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listMediaForTicket(
  ticketLocalId: string,
): Promise<OutboxMedia[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex("outbox_media", "by-ticket", ticketLocalId);
}

export async function listPendingTickets(): Promise<OutboxTicket[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex("outbox_tickets", "by-status", "pending");
}

export async function updateTicketStatus(
  localId: string,
  patch: Partial<
    Pick<OutboxTicket, "status" | "serverId" | "syncedAt" | "errorMessage">
  >,
): Promise<void> {
  const db = await getOfflineDB();
  const existing = await db.get("outbox_tickets", localId);
  if (!existing) return;
  await db.put("outbox_tickets", { ...existing, ...patch });
}

export async function updateMediaStatus(
  id: string,
  patch: Partial<Pick<OutboxMedia, "status" | "errorMessage">>,
): Promise<void> {
  const db = await getOfflineDB();
  const existing = await db.get("outbox_media", id);
  if (!existing) return;
  await db.put("outbox_media", { ...existing, ...patch });
}

export async function pendingCountForOwner(ownerId: string): Promise<number> {
  const tickets = await listOwnTickets(ownerId);
  return tickets.filter((t) => t.status === "pending" || t.status === "error")
    .length;
}
