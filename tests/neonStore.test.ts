import assert from 'node:assert/strict';
import test from 'node:test';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import pg from 'pg';
import { NeonStore, neonConnectionString } from '../src/server/neonStore';

interface Fixture {
  users: unknown[];
  leads: unknown[];
  traffics: unknown[];
  sessions: unknown[];
  counter: number;
}

test('connection validation rejects missing, invalid, and non-Neon values without echoing them', () => {
  for (const value of [undefined, 'not a URL', 'postgresql://test:secret@example.com/db']) {
    assert.throws(() => neonConnectionString(value), /NEON_DATABASE_URL/);
  }
  const url = neonConnectionString("DATABASE_URL='postgresql://test:secret@sample.neon.tech/db?sslmode=require'");
  assert.equal(new URL(url).searchParams.get('sslmode'), 'verify-full');
});

test('Neon storage integration (isolated temporary schema, no real CRM changes)', async t => {
  const connectionString = neonConnectionString(process.env.NEON_DATABASE_URL);
  const schema = `crm_test_${Date.now()}_${process.pid}`;
  const admin = new pg.Pool({ connectionString });
  const stores: NeonStore<Fixture>[] = [];
  const servers: Server[] = [];

  const launch = async (importFile: string) => {
    const pool = new pg.Pool({ connectionString });
    const store = new NeonStore<Fixture>(pool, schema);
    stores.push(store);
    await store.initialize(importFile);
    const app = express();
    app.use(store.middleware);
    app.get('/state', (_req, res) => res.json({ counter: store.load().counter }));
    app.post('/increment', async (_req, res) => {
      const data = store.load();
      await new Promise(resolve => setTimeout(resolve, 5));
      data.counter++;
      store.save(data);
      res.json({ counter: data.counter });
    });
    app.post('/reject', (_req, res) => {
      const data = store.load();
      data.counter = 99;
      store.save(data);
      res.status(400).json({ error: 'Rejected' });
    });
    app.post('/fail', (_req, res) => {
      const data = store.load();
      data.counter = -1;
      store.save(data);
      res.json({ success: true });
    });
    app.post('/throw', (_req, _res) => {
      const data = store.load();
      data.counter = 99;
      store.save(data);
      throw new Error('Intentional route failure');
    });
    app.use((_err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(500).json({ error: 'Intentional route failure' });
    });
    const server = await new Promise<Server>(resolve => {
      const running = app.listen(0, '127.0.0.1', () => resolve(running));
    });
    servers.push(server);
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    return `http://127.0.0.1:${address.port}`;
  };

  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    const first = await launch(fileURLToPath(new URL('./fixtures/crm.json', import.meta.url)));
    await admin.query(`ALTER TABLE ${schema}.shadikabbo_crm_store ADD CHECK ((data->>'counter')::integer >= 0)`);

    await t.test('imports records once and commits before returning success', async () => {
      assert.deepEqual(await (await fetch(`${first}/state`)).json(), { counter: 0 });
      const response = await fetch(`${first}/increment`, { method: 'POST' });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { counter: 1 });
      const saved = await admin.query(`SELECT data->>'counter' AS counter FROM ${schema}.shadikabbo_crm_store`);
      assert.equal(saved.rows[0].counter, '1');
    });

    const second = await launch('/missing-import-file.json');
    await t.test('production refuses a different CRM identity and accepts only the approved database', async () => {
      const oldMode = process.env.NODE_ENV;
      const oldIdentity = process.env.CRM_INSTANCE_ID;
      try {
        process.env.NODE_ENV = 'production';
        process.env.CRM_INSTANCE_ID = 'not-the-approved-crm';
        await assert.rejects(stores[1].initialize('/missing-import-file.json'), /does not match/);
        process.env.CRM_INSTANCE_ID = await stores[0].databaseIdentity();
        await stores[1].initialize('/missing-import-file.json');
      } finally {
        if (oldMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldMode;
        if (oldIdentity === undefined) delete process.env.CRM_INSTANCE_ID; else process.env.CRM_INSTANCE_ID = oldIdentity;
      }
    });
    await t.test('login throttling persists across instances and expires without changing CRM records', async () => {
      for (let i = 0; i < 10; i++) {
        assert.equal((await stores[i % 2].loginAttempt('synthetic-security-test')).allowed, true);
      }
      const blocked = await stores[1].loginAttempt('synthetic-security-test');
      assert.equal(blocked.allowed, false);
      assert.ok(blocked.retryAfter > 0 && blocked.retryAfter <= 900);
      await admin.query(`UPDATE ${schema}.shadikabbo_login_attempts SET expires_at = NOW() - INTERVAL '1 second' WHERE key <> 'global'`);
      assert.equal((await stores[0].loginAttempt('synthetic-security-test')).allowed, true);
    });
    await t.test('new instances use Neon records without reading a local import file', async () => {
      assert.deepEqual(await (await fetch(`${second}/state`)).json(), { counter: 1 });
    });

    await t.test('simultaneous updates across instances do not lose changes', async () => {
      const responses = await Promise.all(Array.from({ length: 8 }, (_, i) =>
        fetch(`${i % 2 ? first : second}/increment`, { method: 'POST' }),
      ));
      assert.ok(responses.every(response => response.status === 200));
      await Promise.all(responses.map(response => response.json()));
      assert.deepEqual(await (await fetch(`${first}/state`)).json(), { counter: 9 });
    });

    await t.test('rejected requests and thrown route errors roll back changes', async () => {
      assert.equal((await fetch(`${first}/reject`, { method: 'POST' })).status, 400);
      assert.equal((await fetch(`${first}/throw`, { method: 'POST' })).status, 500);
      assert.deepEqual(await (await fetch(`${second}/state`)).json(), { counter: 9 });
    });

    await t.test('failed writes return 503, never success, and leave stored records intact', async () => {
      const response = await fetch(`${first}/fail`, { method: 'POST' });
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /No changes were committed/);
      assert.deepEqual(await (await fetch(`${second}/state`)).json(), { counter: 9 });
    });
  } finally {
    await Promise.all(servers.map(server => new Promise<void>(resolve => server.close(() => resolve()))));
    await Promise.all(stores.map(store => store.close()));
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
