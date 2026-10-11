import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { registerSystemRoutes } from '../src/server/systemRoutes';
import { MediaStorage } from '../src/server/mediaStorage';
import { NeonStore } from '../src/server/neonStore';

test('storage setup status and complete backup are real, private, and do not erase stored sessions', async () => {
  const fixture = { users: [{ id: 'admin', role: 'Super Admin' }], sessions: [{ token: 'synthetic-session' }], leads: [], traffics: [], images: [] };
  const store = {
    sessionUser: async (token: string) => token === 'admin' ? { role: 'Super Admin' } : token === 'staff' ? { role: 'MK' } : null,
    readSnapshot: async () => structuredClone(fixture),
  } as unknown as NeonStore<any>;
  const unavailable = new MediaStorage({
    list: async () => ({ ok: false, error: { message: 'no bucket', statusCode: 503 } }),
  } as any);
  const app = express();
  registerSystemRoutes(app, store, unavailable);
  const server: Server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const headers = { Authorization: 'Bearer admin' };
  try {
    assert.equal((await fetch(base + '/api/admin/backup')).status, 401);
    assert.equal((await fetch(base + '/api/admin/backup', { headers: { Authorization: 'Bearer staff' } })).status, 403);
    const status = await fetch(base + '/api/system/storage', { headers });
    assert.equal(status.status, 200);
    assert.equal((await status.json()).available, false);
    assert.equal((await fetch(base + '/api/admin/storage/migrate', { method: 'POST', headers })).status, 409);
    const backup = await fetch(base + '/api/admin/backup', { headers });
    assert.equal(backup.status, 200);
    assert.match(backup.headers.get('content-disposition') || '', /attachment/);
    assert.deepEqual((await backup.json()).sessions, []);
    assert.equal(fixture.sessions.length, 1);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
