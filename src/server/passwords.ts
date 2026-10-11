import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    if (stored.startsWith('scrypt$')) {
      const [, salt, digest] = stored.split('$');
      if (!/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(digest || '')) return false;
      return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(digest, 'hex'));
    }
    if (!/^[a-f0-9]{64}$/.test(stored)) return false;
    const legacy = createHash('sha256').update(password + '_shadikabbo_salt_2026').digest();
    return timingSafeEqual(legacy, Buffer.from(stored, 'hex'));
  } catch { return false; }
}
