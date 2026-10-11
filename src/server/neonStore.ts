import 'dotenv/config';
import { AsyncLocalStorage } from 'node:async_hooks';
import { readFile } from 'node:fs/promises';
import type { RequestHandler } from 'express';
import pg from 'pg';

interface RequestStore<T> {
  data: T;
  dirty: boolean;
}

// Accept a URL or a copied Neon environment-variable snippet without logging it.
export function neonConnectionString(raw: string | undefined): string {
  const urls = raw?.match(/postgres(?:ql)?:\/\/[^\s'"`]+/g) || [];
  if (urls.length !== 1) {
    throw new Error('NEON_DATABASE_URL must contain one PostgreSQL connection URL.');
  }
  let url: URL;
  try {
    url = new URL(urls[0]);
  } catch {
    throw new Error('NEON_DATABASE_URL is not a valid PostgreSQL connection URL.');
  }
  if (!url.hostname.endsWith('.neon.tech') || !url.username || !url.password || url.pathname === '/') {
    throw new Error('NEON_DATABASE_URL must point to an external Neon database with credentials.');
  }
  // Always verify the server certificate; never downgrade TLS.
  url.searchParams.set('sslmode', 'verify-full');
  url.searchParams.delete('uselibpqcompat');
  return url.toString();
}

export class NeonStore<T extends object> {
  private readonly pool: pg.Pool;
  private readonly table: string;
  private readonly context = new AsyncLocalStorage<RequestStore<T>>();

  constructor(pool?: pg.Pool, schema = 'public') {
    if (!/^[a-z][a-z0-9_]*$/.test(schema)) throw new Error('Invalid CRM database schema.');
    this.table = `"${schema}"."shadikabbo_crm_store"`;
    this.pool = pool ?? new pg.Pool({
      connectionString: neonConnectionString(process.env.NEON_DATABASE_URL),
      max: 5,
      connectionTimeoutMillis: 15_000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 30_000,
      idle_in_transaction_session_timeout: 30_000,
    });
    // Do not log driver errors: they can contain connection details.
    this.pool.on('error', () => console.error('An idle Neon connection failed.'));
  }

  async initialize(importFile: string): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const existing = await this.pool.query(`SELECT id FROM ${this.table} WHERE id = 1`);
    if (existing.rowCount) return;

    // This is a one-time import, never a runtime fallback. Keep the source intact.
    let data: T;
    try {
      data = JSON.parse(await readFile(importFile, 'utf8'));
    } catch {
      throw new Error('Neon is empty and the CRM import file is missing or invalid.');
    }
    const source = data as Record<string, unknown>;
    if (!Array.isArray(source.users) || !Array.isArray(source.leads) || !Array.isArray(source.traffics)) {
      throw new Error('The CRM import must contain users, leads, and traffics arrays.');
    }
    const imported = await this.pool.query(
      `INSERT INTO ${this.table} (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(data)],
    );
    console.log(imported.rowCount ? 'Existing CRM records imported into external Neon.' : 'Using existing Neon CRM records.');
  }

  load(): T {
    const store = this.context.getStore();
    if (!store) throw new Error('CRM database access requires an API transaction.');
    return store.data;
  }

  save(data: T): void {
    const store = this.context.getStore();
    if (!store) throw new Error('CRM database access requires an API transaction.');
    store.data = data;
    store.dirty = true;
  }

  // Existing synchronous route handlers work on a request-local snapshot.
  // Lock the row across instances and commit BEFORE sending the response.
  // API routes must use buffered responses, not streaming or flushHeaders().
  middleware: RequestHandler = async (_req, res, next) => {
    let client: pg.PoolClient;
    try {
      client = await this.pool.connect();
    } catch {
      res.status(503).json({ error: 'Neon database is unavailable. Please try again.' });
      return;
    }

    let completed = false;
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        client.release();
      }
    };
    const rollback = async () => {
      try { await client.query('ROLLBACK'); } catch { /* Connection may already be closed. */ }
    };

    try {
      await client.query('BEGIN');
      const result = await client.query(`SELECT data FROM ${this.table} WHERE id = 1 FOR UPDATE`);
      if (result.rowCount !== 1) throw new Error('CRM row missing from Neon.');
      const store: RequestStore<T> = { data: result.rows[0].data, dirty: false };
      const originalEnd = res.end.bind(res);

      res.end = ((...args: any[]) => {
        if (completed) return res;
        completed = true;
        void (async () => {
          try {
            if (res.statusCode >= 400) {
              await rollback();
            } else {
              if (store.dirty) {
                await client.query(
                  `UPDATE ${this.table} SET data = $1::jsonb, updated_at = NOW() WHERE id = 1`,
                  [JSON.stringify(store.data)],
                );
              }
              await client.query('COMMIT');
            }
            originalEnd(...args as Parameters<typeof originalEnd>);
          } catch {
            await rollback();
            console.error('Neon transaction failed; response was not committed.');
            res.statusCode = 503;
            res.removeHeader('Content-Length');
            res.removeHeader('ETag');
            res.setHeader('Content-Type', 'application/json');
            originalEnd(JSON.stringify({ error: 'Database save failed. No changes were committed. Please try again.' }));
          } finally {
            release();
          }
        })();
        return res;
      }) as typeof res.end;

      res.once('close', () => {
        if (!completed) {
          completed = true;
          void rollback().finally(release);
        }
      });
      this.context.run(store, next);
    } catch {
      await rollback();
      release();
      res.status(503).json({ error: 'Unable to read the Neon database. Please try again.' });
    }
  };

  async close(): Promise<void> {
    await this.pool.end();
  }
}
