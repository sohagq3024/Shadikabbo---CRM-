import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPendingOfflineScans,
  getAllOfflineScans,
  syncPendingScans,
  OfflineAttendanceScan,
  enqueueOfflineScan,
} from '../utils/offlineAttendanceSync';

interface UseOfflineAttendanceSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  pendingScans: OfflineAttendanceScan[];
  allScans: OfflineAttendanceScan[];
  isSyncing: boolean;
  lastSyncMessage: string | null;
  triggerSync: () => Promise<void>;
  enqueueScan: (data: {
    userId: string;
    userName: string;
    userRole: string;
    userPhone?: string;
    qrCode: string;
    type: 'in' | 'out';
  }) => OfflineAttendanceScan;
}

export function useOfflineAttendanceSync(token: string | null): UseOfflineAttendanceSyncReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [pendingScans, setPendingScans] = useState<OfflineAttendanceScan[]>(() => getPendingOfflineScans());
  const [allScans, setAllScans] = useState<OfflineAttendanceScan[]>(() => getAllOfflineScans());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
  const syncTimeoutRef = useRef<any>(null);

  const refreshState = useCallback(() => {
    setPendingScans(getPendingOfflineScans());
    setAllScans(getAllOfflineScans());
  }, []);

  const triggerSync = useCallback(async () => {
    if (!token || !navigator.onLine || isSyncing) return;
    const pending = getPendingOfflineScans();
    if (pending.length === 0) return;

    setIsSyncing(true);
    setLastSyncMessage('Syncing offline scans with server...');

    try {
      const result = await syncPendingScans(token);
      refreshState();
      if (result.success && result.syncedCount > 0) {
        setLastSyncMessage(`Successfully synced ${result.syncedCount} offline attendance log(s)!`);
        // Play subtle success cue if audio available
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.25);
        } catch (_) {}
      } else if (!result.success) {
        setLastSyncMessage(`Sync failed: ${result.errors.join(', ')}`);
      }
    } catch (err: any) {
      setLastSyncMessage(`Sync failed: ${err.message || 'Unknown network error'}`);
    } finally {
      setIsSyncing(false);
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        setLastSyncMessage(null);
      }, 5000);
    }
  }, [token, isSyncing, refreshState]);

  // Online / Offline and Custom Event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync immediately when connection is restored!
      setTimeout(() => {
        triggerSync();
      }, 500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = () => {
      refreshState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        triggerSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('shadikabbo_attendance_queue_changed', handleQueueChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check: if already online with pending scans, sync
    if (navigator.onLine && getPendingOfflineScans().length > 0) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('shadikabbo_attendance_queue_changed', handleQueueChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(syncTimeoutRef.current);
    };
  }, [triggerSync, refreshState]);

  const enqueueScan = useCallback(
    (data: {
      userId: string;
      userName: string;
      userRole: string;
      userPhone?: string;
      qrCode: string;
      type: 'in' | 'out';
    }) => {
      const scan = enqueueOfflineScan(data);
      refreshState();
      // If we are actually online right now, try to sync immediately
      if (navigator.onLine) {
        setTimeout(() => triggerSync(), 200);
      }
      return scan;
    },
    [refreshState, triggerSync]
  );

  return {
    isOnline,
    pendingCount: pendingScans.length,
    pendingScans,
    allScans,
    isSyncing,
    lastSyncMessage,
    triggerSync,
    enqueueScan,
  };
}
