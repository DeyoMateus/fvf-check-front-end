import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { pendingCountForOwner } from "../lib/offline/outbox";
import {
  runSync,
  onSyncChange,
  isSyncRunning,
} from "../lib/offline/sync-engine";

export function useOfflineSync() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const count = await pendingCountForOwner(user.id);
    setPendingCount(count);
    setIsSyncing(isSyncRunning());
  }, [user?.id]);

  useEffect(() => {
    refresh();
    const unsubscribe = onSyncChange(refresh);

    // Tenta sincronizar assim que o app abre/foca, além do listener "online" global
    void runSync();
    function onFocus() {
      void runSync();
    }
    window.addEventListener("focus", onFocus);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return {
    pendingCount,
    isSyncing,
    triggerSync: runSync,
  };
}
