import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  CreateTicketPayload,
  MediaType,
} from "../../services/tickets.service";

export type OutboxStatus = "pending" | "syncing" | "synced" | "error";

export interface OutboxTicket {
  localId: string;
  ownerId: string;
  status: OutboxStatus;
  serverId: string | null;
  payload: CreateTicketPayload;
  createdAt: string;
  syncedAt?: string;
  errorMessage?: string;
}

export interface OutboxMedia {
  id: string;
  ticketLocalId: string;
  ownerId: string;
  blob: Blob;
  mediaType: MediaType;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  status: OutboxStatus;
  errorMessage?: string;

  // Se preenchido, essa mídia pertence a uma peça específica adicionada
  // ao ticket (identificada pelo partCode, já que o servidor ainda não
  // gerou o ticketPartId real enquanto o registro está offline).
  partCode?: string;
}

interface FvfOfflineDB extends DBSchema {
  outbox_tickets: {
    key: string;
    value: OutboxTicket;
    indexes: { "by-owner": string; "by-status": OutboxStatus };
  };
  outbox_media: {
    key: string;
    value: OutboxMedia;
    indexes: { "by-ticket": string; "by-status": OutboxStatus };
  };
}

const DB_NAME = "fvf-check-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FvfOfflineDB>> | null = null;

export function getOfflineDB(): Promise<IDBPDatabase<FvfOfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FvfOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const tickets = db.createObjectStore("outbox_tickets", {
          keyPath: "localId",
        });
        tickets.createIndex("by-owner", "ownerId");
        tickets.createIndex("by-status", "status");

        const media = db.createObjectStore("outbox_media", {
          keyPath: "id",
        });
        media.createIndex("by-ticket", "ticketLocalId");
        media.createIndex("by-status", "status");
      },
    });
  }
  return dbPromise;
}
