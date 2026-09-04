import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ticketsService, type Ticket } from "../services/tickets.service";
import { listOwnTickets, listMediaForTicket } from "../lib/offline/outbox";
import { onSyncChange } from "../lib/offline/sync-engine";
import { OutboxTicket } from "@/lib/offline/db";

export interface OfflineTicketWithMediaCount extends OutboxTicket {
  mediaCount: number;
}

export type MontadorTicketItem =
  | { kind: "synced"; ticket: Ticket }
  | { kind: "offline"; record: OfflineTicketWithMediaCount };

export function useMontadorTickets() {
  const { user } = useAuth();
  const [serverTickets, setServerTickets] = useState<Ticket[]>([]);
  const [offlineTickets, setOfflineTickets] = useState<
    OfflineTicketWithMediaCount[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [serverUnavailable, setServerUnavailable] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // O backend já filtra por createdById quando role === ASSEMBLER,
    // então getAll() aqui já retorna só os chamados do próprio montador.
    const serverPromise = ticketsService
      .getAll()
      .then((data) => {
        setServerUnavailable(false);
        return data;
      })
      .catch(() => {
        setServerUnavailable(true);
        return [] as Ticket[];
      });

    const offlinePromise = listOwnTickets(user.id).then(async (records) => {
      // só os que ainda não foram sincronizados — os "synced" já aparecem via serverTickets
      const pendingOrError = records.filter((r) => r.status !== "synced");
      return Promise.all(
        pendingOrError.map(async (r) => ({
          ...r,
          mediaCount: (await listMediaForTicket(r.localId)).length,
        })),
      );
    });

    const [server, offline] = await Promise.all([
      serverPromise,
      offlinePromise,
    ]);
    setServerTickets(server);
    setOfflineTickets(offline);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
    const unsubscribe = onSyncChange(load);
    window.addEventListener("online", load);
    window.addEventListener("focus", load);
    return () => {
      unsubscribe();
      window.removeEventListener("online", load);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  const items: MontadorTicketItem[] = [
    ...offlineTickets.map((record) => ({ kind: "offline" as const, record })),
    ...serverTickets.map((ticket) => ({ kind: "synced" as const, ticket })),
  ];

  return { items, loading, serverUnavailable, reload: load };
}
