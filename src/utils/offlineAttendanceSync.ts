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

import {
  formatBangladeshDateYMD,
  formatBangladeshTime12,
} from './bangladeshTime';

const STORAGE_KEY = 'shadikabbo_offline_attendance_queue';
const SYNC_EVENT_NAME = 'shadikabbo_attendance_queue_changed';

// Helper: Format Date to YYYY-MM-DD in Bangladesh Time
export function formatLocalYMD(date: Date): string {
  return formatBangladeshDateYMD(date);
}

// Helper: Format Time to 12-hour AM/PM in Bangladesh Time
export function formatLocalTime12(date: Date): string {
  return formatBangladeshTime12(date);
}

/**
 * Retrieve all scans from local storage
 */
export function getAllOfflineScans(strict = false): OfflineAttendanceScan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const scans = JSON.parse(raw);
    if (!Array.isArray(scans)) throw new Error('Offline attendance queue is invalid.');
    return scans;
  } catch (err) {
    if (strict) throw new Error('The existing offline queue could not be read. It has not been replaced or synced.');
    console.warn('Offline queue is unavailable; its existing contents were not replaced.');
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
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && !Array.isArray(JSON.parse(existing))) throw new Error('Existing queue is invalid; do not overwrite it.');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  } catch (err) {
    throw new Error('Offline attendance could not be saved on this device. Keep the app online and retry; this scan is not saved.');
  }
  window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { count: scans.filter(s => !s.synced).length } }));
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
  const scans = getAllOfflineScans(true);
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

  let pending: OfflineAttendanceScan[];
  try { pending = getAllOfflineScans(true).filter(item => !item.synced); }
  catch (error) {
    return { success: false, syncedCount: 0, failedCount: 0, errors: [(error as Error).message] };
  }
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
    const pendingIds = new Set(pending.map(item => item.id));
    if (!Array.isArray(data.syncedIds) || data.syncedIds.some((id: unknown) => typeof id !== 'string' || !pendingIds.has(id))) {
      throw new Error('The server did not confirm which attendance scans were saved. Pending scans have been retained.');
    }
    const syncedIds = [...new Set<string>(data.syncedIds)];

    // Mark successful items
    syncedIds.forEach((id) => markScanAsSynced(id));

    return {
      success: syncedIds.length === pending.length,
      syncedCount: syncedIds.length,
      failedCount: pending.length - syncedIds.length,
      errors: syncedIds.length === pending.length ? [] : ['Some scans are still pending server confirmation.'],
    };
  } catch (err: any) {
    console.error('Failed to sync offline scans:', err);
    for (const item of pending) {
      try { markScanSyncFailed(item.id, err.message || 'Network sync failed'); } catch { /* Never discard the previous stored queue. */ }
    }
    return {
      success: false,
      syncedCount: 0,
      failedCount: pending.length,
      errors: [err.message || 'Sync failed'],
    };
  }
}
