import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  HardDrive,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Upload,
} from 'lucide-react';

interface StorageStatus {
  available: boolean;
  provider: 'Replit Default App Storage' | string;
  database: 'External Neon' | string;
  pendingInlineFiles: number;
  storedReferences: number;
}

interface StorageSafetyPanelProps {
  token: string;
}

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = await response.json();
    if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message;
  } catch {
    // Keep the status-specific message when the server response is not JSON.
  }
  return `${fallback} (HTTP ${response.status})`;
};

export const StorageSafetyPanel: React.FC<StorageSafetyPanelProps> = ({ token }) => {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setIsChecking(true);
    setStatusError(null);
    try {
      const response = await fetch('/api/system/storage', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Could not check storage status.'));
      }
      const payload = await response.json();
      const valid =
        typeof payload?.available === 'boolean' &&
        typeof payload?.provider === 'string' &&
        typeof payload?.database === 'string' &&
        Number.isFinite(payload?.pendingInlineFiles) &&
        Number.isFinite(payload?.storedReferences);
      if (!valid) throw new Error('Storage status response was incomplete. Try checking again.');
      setStatus(payload as StorageStatus);
      setCheckedAt(new Date());
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Could not check storage status.');
    } finally {
      setIsChecking(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationError(null);
    setMigrationMessage(null);
    try {
      const response = await fetch('/api/admin/storage/migrate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Storage migration failed.'));
      }
      const payload = await response.json();
      if (payload?.success !== true || !Number.isFinite(payload?.migrated)) {
        throw new Error('Migration response was incomplete. Check storage status before retrying.');
      }
      setMigrationMessage(`Server confirmed ${payload.migrated} file${payload.migrated === 1 ? '' : 's'} migrated.`);
      await refreshStatus();
    } catch (error) {
      setMigrationError(error instanceof Error ? error.message : 'Storage migration failed.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleBackupDownload = async () => {
    setIsDownloading(true);
    setBackupError(null);
    setBackupMessage(null);
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Secure backup download failed.'));
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && !contentType.includes('+json')) {
        throw new Error('The server did not return the expected CRM backup file.');
      }
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('The server returned an empty backup file.');

      const disposition = response.headers.get('content-disposition') || '';
      const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
      const filename = encodedName
        ? decodeURIComponent(encodedName)
        : plainName || `shadikabbo-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      setBackupMessage('Backup download started. Keep this private file in a secure location.');
    } catch (error) {
      setBackupError(error instanceof Error ? error.message : 'Secure backup download failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  const actionButton =
    'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55';

  return (
    <section className="max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce2f0] bg-[#eef1fa] text-[#181E54]">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Storage safety &amp; file migration</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Live service check for private customer-file storage and pending migration.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshStatus()}
            disabled={isChecking}
            className={`${actionButton} border border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
          >
            {isChecking ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {isChecking ? 'Checking' : 'Check storage'}
          </button>
          <button
            type="button"
            onClick={() => void handleMigration()}
            disabled={!status?.available || status.pendingInlineFiles < 1 || isMigrating || isChecking}
            className={`${actionButton} bg-[#181E54] text-white hover:bg-[#121642]`}
          >
            {isMigrating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {isMigrating ? 'Migrating files' : 'Migrate pending files'}
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {statusError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Storage check failed</p>
              <p className="mt-0.5 break-words">{statusError}</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshStatus()}
              className="shrink-0 font-bold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {isChecking && !status && !statusError ? (
          <div aria-label="Checking storage services" className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <div key={item} className="h-[74px] animate-pulse rounded-xl border border-slate-100 bg-slate-50" />
            ))}
          </div>
        ) : status ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${status.available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {status.available ? <Cloud className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Private file storage</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${status.available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                      {status.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-xs font-semibold text-slate-800">{status.provider}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef1fa] text-[#181E54]">
                  <Database className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CRM records database</span>
                  <p className="mt-1 break-words text-xs font-semibold text-slate-800">{status.database}</p>
                </div>
              </div>
            </div>

            {!status.available && (
              <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-950">
                <p className="font-bold">Create the default app-storage bucket to enable private file storage.</p>
                <p className="mt-1">
                  In Replit, open <strong>Tools &gt; App Storage &gt; Create new bucket</strong>, then select the new bucket or set it as the default bucket.
                  No source changes or restart are needed: the backend retries readiness automatically, and this panel’s migration action performs the conversion.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                <span className="text-slate-500">Pending inline files</span>
                <strong className="ml-2 font-mono text-slate-900">{status.pendingInlineFiles}</strong>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                <span className="text-slate-500">Stored file references</span>
                <strong className="ml-2 font-mono text-slate-900">{status.storedReferences}</strong>
              </div>
              {checkedAt && (
                <span className="self-center text-[10px] text-slate-400">
                  Checked {checkedAt.toLocaleTimeString()}
                </span>
              )}
            </div>
          </>
        ) : !statusError ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Storage status has not been confirmed yet. Use “Check storage” to query the server.
          </div>
        ) : null}

        {(migrationMessage || migrationError) && (
          <div
            role={migrationError ? 'alert' : 'status'}
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${migrationError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
          >
            {migrationError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{migrationError || migrationMessage}</span>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-[#f8f9fc] p-3.5">
          <h4 className="text-xs font-bold text-slate-800">Where your data lives</h4>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-600">
            <li>CRM records are stored in External Neon; customer files are stored in private Replit Default App Storage.</li>
            <li>Browser storage holds session and UI preferences, plus attendance queued temporarily while offline. It is not the CRM database.</li>
            <li>Clearing browser data can remove attendance that has not synced. A queued scan is not confirmed until the server acknowledges it.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#D81124]" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Complete CRM backup</h4>
              <p className="mt-0.5 max-w-xl text-[11px] leading-relaxed text-slate-500">
                Downloads the server-generated application backup, including real CRM records and included media bytes; session data is excluded.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleBackupDownload()}
            disabled={isDownloading}
            className={`${actionButton} shrink-0 bg-[#181E54] text-white hover:bg-[#121642]`}
          >
            {isDownloading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {isDownloading ? 'Preparing backup' : 'Download secure backup'}
          </button>
        </div>
        <p className="text-[11px] font-semibold leading-relaxed text-rose-800">
          This backup contains private customer data. Store it securely and share it only with authorized people.
        </p>
        {(backupMessage || backupError) && (
          <div
            role={backupError ? 'alert' : 'status'}
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${backupError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
          >
            {backupError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{backupError || backupMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
};
