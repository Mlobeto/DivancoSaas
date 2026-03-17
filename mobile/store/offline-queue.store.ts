/**
 * OFFLINE QUEUE STORE
 *
 * Persiste evidencias pendientes en SQLite cuando no hay red.
 * Al recuperar conexión, llama syncAll() para subir todo.
 *
 * Uso:
 *   const enqueue  = useOfflineQueueStore(s => s.enqueue);
 *   const syncAll  = useOfflineQueueStore(s => s.syncAll);
 *   const pending  = useOfflineQueueStore(s => s.pending);
 */

import * as SQLite from "expo-sqlite";
import { create } from "zustand";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingUpload {
  id: number;
  assignmentId: string;
  assetName: string;
  photoType: string;
  label: string;
  photoUri: string;
  fileName: string;
  notes: string;
  enqueuedAt: string;
  retries: number;
}

interface OfflineQueueState {
  pending: PendingUpload[];
  isSyncing: boolean;

  /** Inicializa SQLite y carga la cola. Llamar en app mount. */
  init: () => Promise<void>;
  /** Guarda un ítem pendiente en SQLite. */
  enqueue: (
    item: Omit<PendingUpload, "id" | "enqueuedAt" | "retries">,
  ) => Promise<void>;
  /** Elimina un ítem de la cola (tras upload exitoso). */
  remove: (id: number) => Promise<void>;
  /** Intenta subir todos los ítems pendientes. */
  syncAll: () => Promise<{ success: number; failed: number }>;
  /** Recarga la cola desde SQLite. Uso interno. */
  _load: () => Promise<void>;
}

// ─── SQLite helper ────────────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("divanco_offline.db");
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_uploads (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      assignmentId  TEXT    NOT NULL,
      assetName     TEXT    NOT NULL DEFAULT '',
      photoType     TEXT    NOT NULL,
      label         TEXT    NOT NULL DEFAULT '',
      photoUri      TEXT    NOT NULL,
      fileName      TEXT    NOT NULL DEFAULT 'evidence.jpg',
      notes         TEXT    NOT NULL DEFAULT '',
      enqueuedAt    TEXT    NOT NULL,
      retries       INTEGER NOT NULL DEFAULT 0
    );
  `);
  return _db;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOfflineQueueStore = create<OfflineQueueState>()((set, get) => ({
  pending: [],
  isSyncing: false,

  init: async () => {
    await getDb();
    await get()._load();
  },

  _load: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<PendingUpload>(
      "SELECT * FROM pending_uploads ORDER BY enqueuedAt ASC",
    );
    set({ pending: rows });
  },

  enqueue: async (item) => {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO pending_uploads
         (assignmentId, assetName, photoType, label, photoUri, fileName, notes, enqueuedAt, retries)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        item.assignmentId,
        item.assetName,
        item.photoType,
        item.label,
        item.photoUri,
        item.fileName,
        item.notes,
        new Date().toISOString(),
      ],
    );
    await get()._load();
  },

  remove: async (id) => {
    const db = await getDb();
    await db.runAsync("DELETE FROM pending_uploads WHERE id = ?", [id]);
    await get()._load();
  },

  syncAll: async () => {
    if (get().isSyncing) return { success: 0, failed: 0 };
    const { pending } = get();
    if (pending.length === 0) return { success: 0, failed: 0 };

    set({ isSyncing: true });
    let success = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        const formData = new FormData();
        formData.append("photo", {
          uri: item.photoUri,
          name: item.fileName,
          type: "image/jpeg",
        } as any);
        formData.append("photoType", item.photoType);
        if (item.notes) formData.append("notes", item.notes);

        await api.post(
          `/mobile/assignments/${item.assignmentId}/evidence`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );

        await get().remove(item.id);
        success++;
      } catch {
        // Incrementa contador de reintentos sin bloquear el resto
        const db = await getDb();
        await db.runAsync(
          "UPDATE pending_uploads SET retries = retries + 1 WHERE id = ?",
          [item.id],
        );
        failed++;
      }
    }

    await get()._load();
    set({ isSyncing: false });
    return { success, failed };
  },
}));
