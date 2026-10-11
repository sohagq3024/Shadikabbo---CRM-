import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { consumeLoginAttempt, SESSION_MAX_AGE_MS } from './authSecurity';
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
  private readonly loginTable: string;
  private readonly context = new AsyncLocalStorage<RequestStore<T>>();

  constructor(pool?: pg.Pool, schema = 'public') {
    if (!/^[a-z][a-z0-9_]*$/.test(schema)) throw new Error('Invalid CRM database schema.');
    this.table = `"${schema}"."shadikabbo_crm_store"`;
    this.loginTable = `"${schema}"."shadikabbo_login_attempts"`;
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
    const existing = await this.pool.query(`SELECT id, data->>'crmInstanceId' AS identity FROM ${this.table} WHERE id = 1`);
    if (process.env.NODE_ENV === 'production') {
      if (!existing.rowCount || !process.env.CRM_INSTANCE_ID || existing.rows[0].identity !== process.env.CRM_INSTANCE_ID) {
        throw new Error('Production Neon does not match the approved CRM database. Local records will not be imported.');
      }
    }
    if (existing.rowCount) {
      if (!existing.rows[0].identity) {
        await this.pool.query(`UPDATE ${this.table} SET data = jsonb_set(data, '{crmInstanceId}', to_jsonb($1::text)) WHERE id = 1 AND COALESCE(data->>'crmInstanceId', '') = ''`, [randomUUID()]);
      }
      await this.initializeLoginLimits();
      return;
    }

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
    source.crmInstanceId = randomUUID();
    const imported = await this.pool.query(
      `INSERT INTO ${this.table} (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(data)],
    );
    console.log(imported.rowCount ? 'Existing CRM records imported into external Neon.' : 'Using existing Neon CRM records.');
    await this.initializeLoginLimits();
  }

  private async initializeLoginLimits(): Promise<void> {
    await this.pool.query(`CREATE TABLE IF NOT EXISTS ${this.loginTable} (
      key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL
    )`);
  }

  async loginAttempt(phone: string) {
    return consumeLoginAttempt(this.pool, this.loginTable, phone);
  }

  async databaseIdentity(): Promise<string> {
    const result = await this.pool.query(`SELECT data->>'crmInstanceId' AS identity FROM ${this.table} WHERE id = 1`);
    if (!result.rows[0]?.identity) throw new Error('CRM identity is missing.');
    return result.rows[0].identity;
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

  async migrate(transform: (data: T) => Promise<number> | number): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL idle_in_transaction_session_timeout = '120s'");
      const result = await client.query(`SELECT data FROM ${this.table} WHERE id = 1 FOR UPDATE`);
      if (result.rowCount !== 1) throw new Error('CRM data is missing.');
      const data = result.rows[0].data as T;
      const changed = await transform(data);
      if (changed) {
        await client.query(`UPDATE ${this.table} SET data = $1::jsonb, updated_at = NOW() WHERE id = 1`, [JSON.stringify(data)]);
      }
      await client.query('COMMIT');
      return changed;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* The connection may already be closed. */ }
      throw error;
    } finally { client.release(); }
  }

  async sessionUser(token: string): Promise<Record<string, any> | null> {
    const result = await this.pool.query(`
      SELECT u.value AS account
      FROM ${this.table} AS crm
      CROSS JOIN LATERAL jsonb_array_elements(crm.data->'users') AS u(value)
      WHERE crm.id = 1 AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(crm.data->'sessions') AS s(value)
        WHERE s.value->>'token' = $1 AND s.value->>'userId' = u.value->>'id'
        AND CASE WHEN jsonb_typeof(s.value->'createdAt') = 'number'
          THEN (s.value->>'createdAt')::numeric > $2 AND (s.value->>'createdAt')::numeric <= $3
          ELSE FALSE END
      )
    `, [token, Date.now() - SESSION_MAX_AGE_MS, Date.now()]);
    const user = result.rows[0]?.account;
    return user && user.status !== 'suspended' ? user : null;
  }

  async readSnapshot(): Promise<T> {
    const result = await this.pool.query(`SELECT data FROM ${this.table} WHERE id = 1`);
    if (result.rowCount !== 1) throw new Error('CRM data is missing.');
    return result.rows[0].data;
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
