/**
 * Offline Attendance Synchronization Strategy
 * Handles local storage queueing when staff members scan QR codes offline,
 * and automatically synchronizes queued logs to the server when connection is restored.
 */

export interface OfflineAttendanceScan {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userPhone?: string;
  qrCode: string;
  timestamp: number;
  date: string;
  recordedTimeStr: string;
  type: 'in' | 'out';
  synced: boolean;
  syncError?: string;
  attempts: number;
  syncedAt?: number;
}

const STORAGE_KEY = 'shadikabbo_offline_attendance_queue';
const SYNC_EVENT_NAME = 'shadikabbo_attendance_queue_changed';

// Helper: Format Date to YYYY-MM-DD
export function formatLocalYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Format Time to 12-hour AM/PM
export function formatLocalTime12(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');
  const strMinutes = String(minutes).padStart(2, '0');
  return `${strHours}:${strMinutes} ${ampm}`;
}

/**
 * Retrieve all scans from local storage
 */
export function getAllOfflineScans(): OfflineAttendanceScan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse offline scans from localStorage:', err);
    return [];
  }
}

/**
 * Get only pending (unsynced) scans
 */
export function getPendingOfflineScans(): OfflineAttendanceScan[] {
  return getAllOfflineScans().filter((item) => !item.synced);
}

/**
 * Save or update offline queue in local storage and notify listeners
 */
function setOfflineScans(scans: OfflineAttendanceScan[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { count: scans.filter(s => !s.synced).length } }));
  } catch (err) {
    console.error('Failed to persist offline scans:', err);
  }
}

/**
 * Enqueue a new offline attendance scan
 */
export function enqueueOfflineScan(data: {
  userId: string;
  userName: string;
  userRole: string;
  userPhone?: string;
  qrCode: string;
  type: 'in' | 'out';
  customTimestamp?: number;
}): OfflineAttendanceScan {
  const scans = getAllOfflineScans();
  const timestamp = data.customTimestamp || Date.now();
  const scanDate = new Date(timestamp);

  const newScan: OfflineAttendanceScan = {
    id: `off_${timestamp}_${Math.random().toString(36).substring(2, 8)}`,
    userId: data.userId,
    userName: data.userName,
    userRole: data.userRole,
    userPhone: data.userPhone,
    qrCode: data.qrCode,
    timestamp,
    date: formatLocalYMD(scanDate),
    recordedTimeStr: formatLocalTime12(scanDate),
    type: data.type,
    synced: false,
    attempts: 0,
  };

  scans.unshift(newScan);
  setOfflineScans(scans);

  // Attempt background sync registration if available in Service Worker
  tryRegisterBackgroundSync();

  return newScan;
}

/**
 * Register Background Sync in Service Worker if supported by browser
 */
export async function tryRegisterBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'sync' in reg) {
        await (reg as any).sync.register('attendance-sync');
        console.log('Registered background sync tag: attendance-sync');
      }
    } catch (e) {
      // Background sync may be unsupported or restricted
    }
  }
}

/**
 * Mark a scan as synced
 */
export function markScanAsSynced(scanId: string) {
  const scans = getAllOfflineScans();
  const index = scans.findIndex((s) => s.id === scanId);
  if (index !== -1) {
    scans[index].synced = true;
    scans[index].syncedAt = Date.now();
    delete scans[index].syncError;
    setOfflineScans(scans);
  }
}

/**
 * Mark a scan with sync error and increment attempt
 */
export function markScanSyncFailed(scanId: string, error: string) {
  const scans = getAllOfflineScans();
  const index = scans.findIndex((s) => s.id === scanId);
  if (index !== -1) {
    scans[index].attempts = (scans[index].attempts || 0) + 1;
    scans[index].syncError = error;
    setOfflineScans(scans);
  }
}

/**
 * Clear all already-synced scans to prevent bloat
 */
export function clearSyncedScans() {
  const pendingOnly = getAllOfflineScans().filter((s) => !s.synced);
  setOfflineScans(pendingOnly);
}

/**
 * Synchronize all pending offline scans to the server
 */
export async function syncPendingScans(token: string): Promise<{
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}> {
  if (!navigator.onLine) {
    return { success: false, syncedCount: 0, failedCount: 0, errors: ['Device is currently offline'] };
  }

  const pending = getPendingOfflineScans();
  if (pending.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
  }

  try {
    const response = await fetch('/api/attendance/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: pending }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    const syncedIds: string[] = data.syncedIds || pending.map((p) => p.id);

    // Mark successful items
    syncedIds.forEach((id) => markScanAsSynced(id));

    return {
      success: true,
      syncedCount: syncedIds.length,
      failedCount: pending.length - syncedIds.length,
      errors: [],
    };
  } catch (err: any) {
    console.error('Failed to sync offline scans:', err);
    pending.forEach((item) => markScanSyncFailed(item.id, err.message || 'Network sync failed'));
    return {
      success: false,
      syncedCount: 0,
      failedCount: pending.length,
      errors: [err.message || 'Sync failed'],
    };
  }
}
