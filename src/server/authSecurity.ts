import { createHash } from 'node:crypto';
import type pg from 'pg';

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function isSessionActive(session: { createdAt?: unknown } | undefined, now = Date.now()): boolean {
  return typeof session?.createdAt === 'number' && Number.isFinite(session.createdAt)
    && session.createdAt <= now && session.createdAt > now - SESSION_MAX_AGE_MS;
}

/** Shared PostgreSQL counters protect all production instances, not just one process. */
export async function consumeLoginAttempt(pool: Pick<pg.Pool, 'query'>, table: string, phone: string) {
  const consume = async (key: string, seconds: number, limit: number) => {
    const result = await pool.query(`
      INSERT INTO ${table} AS bucket (key, attempts, expires_at)
      VALUES ($1, 1, NOW() + $2::integer * INTERVAL '1 second')
      ON CONFLICT (key) DO UPDATE SET
        attempts = CASE WHEN bucket.expires_at <= NOW() THEN 1 ELSE bucket.attempts + 1 END,
        expires_at = CASE WHEN bucket.expires_at <= NOW() THEN EXCLUDED.expires_at ELSE bucket.expires_at END
      RETURNING attempts, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (expires_at - NOW()))))::integer AS retry_after
    `, [key, seconds]);
    const row = result.rows[0];
    return { allowed: row.attempts <= limit, retryAfter: row.retry_after as number, attempts: row.attempts as number };
  };
  // A global cap also bounds the number of account buckets an attacker can create.
  const global = await consume('global', 60, 120);
  if (!global.allowed) return global;
  if (global.attempts % 20 === 1) await pool.query(`DELETE FROM ${table} WHERE expires_at <= NOW()`);
  // Never persist the submitted phone number in security counters.
  return consume(createHash('sha256').update(phone.trim()).digest('hex'), 15 * 60, 10);
}
