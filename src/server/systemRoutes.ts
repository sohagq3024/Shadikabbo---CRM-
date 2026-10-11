import type { Express, Request, Response } from 'express';
import { NeonStore } from './neonStore';
import { MediaError, MediaStorage } from './mediaStorage';
import { collectMediaKeys, countInlineFiles, migrateLegacyMedia, cleanupUnusedMedia } from './mediaLifecycle';

export function registerSystemRoutes<T extends Record<string, any>>(app: Express, store: NeonStore<T>, media: MediaStorage): void {
  const admin = async (req: Request, res: Response) => {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    const user = token && await store.sessionUser(token);
    if (!user) { res.status(401).json({ error: 'Sign in to access cloud storage settings.' }); return false; }
    if (user.role !== 'Super Admin') { res.status(403).json({ error: 'Only Super Admin can access backups and storage management.' }); return false; }
    return true;
  };
  app.get('/api/system/storage', async (req, res) => {
    try {
      if (!await admin(req, res)) return;
      const data = await store.readSnapshot();
      res.set('Cache-Control', 'private, no-store').json({
        available: await media.ready(), provider: 'Replit Default App Storage', database: 'External Neon',
        pendingInlineFiles: countInlineFiles(data), storedReferences: collectMediaKeys(data).size,
      });
    } catch { res.status(503).json({ error: 'Cloud storage status could not be verified. Please retry.' }); }
  });
  app.post('/api/admin/storage/migrate', async (req, res) => {
    try {
      if (!await admin(req, res)) return;
      if (!await media.ready()) {
        res.status(409).json({ error: 'The default App Storage bucket is not provisioned. Open Tools > App Storage > Create new bucket and select it as default, then retry. Existing files remain unchanged.' });
        return;
      }
      const migrated = await migrateLegacyMedia(store, media);
      res.json({ success: true, migrated });
    } catch { res.status(503).json({ error: 'File migration failed. Existing CRM records were retained; retry when storage is available.' }); }
  });
  app.get('/api/admin/backup', async (req, res) => {
    try {
      if (!await admin(req, res)) return;
      const snapshot: Record<string, any> = await store.readSnapshot();
      snapshot.sessions = [];
      const backup = await media.inlineBackup(snapshot);
      const body = JSON.stringify({ ...backup, _backup: { formatVersion: 1, exportedAt: new Date().toISOString(), includesMedia: true } });
      if (Buffer.byteLength(body) > 140 * 1024 * 1024) throw new MediaError('The backup is too large for this export. No partial backup was downloaded.', 413);
      res.set({
        'Cache-Control': 'private, no-store',
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="shadikabbo-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      }).send(body);
    } catch (error) {
      const failure = error instanceof MediaError ? error : new MediaError('Backup failed. No partial export was generated.', 503);
      res.status(failure.status).json({ error: failure.message });
    }
  });
}

export function startMediaMaintenance<T extends Record<string, any>>(store: NeonStore<T>, media: MediaStorage): void {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      if (!await media.ready()) return;
      await migrateLegacyMedia(store, media);
      await cleanupUnusedMedia(store, media);
    } catch { console.warn('Media maintenance could not complete; existing referenced files were not intentionally deleted.'); }
    finally { running = false; }
  }, 60 * 60 * 1000);
  timer.unref();
}
