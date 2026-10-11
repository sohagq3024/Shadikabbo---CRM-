import { mediaKey, MediaStorage } from './mediaStorage';
import { NeonStore } from './neonStore';

type CrmData = Record<string, any>;
type MediaEntry = { key: string; firstSeenAt: number; unusedSince?: number };
export const UNUSED_FILE_GRACE_MS = 24 * 60 * 60 * 1000;

export function collectMediaKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    const key = mediaKey(value);
    if (key) keys.add(key);
  } else if (Array.isArray(value)) {
    for (const child of value) collectMediaKeys(child, keys);
  } else if (value && typeof value === 'object') {
    for (const child of Object.values(value)) collectMediaKeys(child, keys);
  }
  return keys;
}

export function countInlineFiles(value: unknown): number {
  if (typeof value === 'string') return /^data:(?:image\/|application\/pdf;)/.test(value) ? 1 : 0;
  if (Array.isArray(value)) return value.reduce((count, child) => count + countInlineFiles(child), 0);
  if (value && typeof value === 'object') return Object.values(value).reduce<number>((count, child) => count + countInlineFiles(child), 0);
  return 0;
}

export function planMediaCleanup(data: CrmData, bucketKeys: string[], now: number): string[] {
  const referenced = collectMediaKeys(data);
  const present = new Set(bucketKeys);
  const entries: MediaEntry[] = [];
  const deletable: string[] = [];
  // UUID shape is not proof of ownership: a shared default bucket may contain
  // other applications' files. Only uploads recorded by this CRM are eligible.
  for (const tracked of (Array.isArray(data._mediaObjects) ? data._mediaObjects : [])) {
    const key = tracked.key;
    if (!mediaKey('replit-media:' + key)) continue;
    const entry: MediaEntry = { ...tracked };
    if (!present.has(key)) { entries.push(entry); continue; }
    if (referenced.has(key)) delete entry.unusedSince;
    else {
      entry.unusedSince ??= now;
      if (now - entry.unusedSince >= UNUSED_FILE_GRACE_MS) deletable.push(key);
    }
    entries.push(entry);
  }
  data._mediaObjects = entries;
  return deletable;
}

export function trackUploadedMedia(data: CrmData, uploaded: string[], now = Date.now()): void {
  const entries: MediaEntry[] = Array.isArray(data._mediaObjects) ? data._mediaObjects : [];
  const known = new Set(entries.map(entry => entry.key));
  for (const key of uploaded) {
    if (mediaKey('replit-media:' + key) && !known.has(key)) {
      entries.push({ key, firstSeenAt: now });
      known.add(key);
    }
  }
  data._mediaObjects = entries;
}

export async function migrateLegacyMedia<T extends CrmData>(store: NeonStore<T>, media: MediaStorage): Promise<number> {
  const uploaded: string[] = [];
  try {
    return await store.migrate(async data => {
      const result = await media.externalize(data, uploaded);
      if (result.count) {
        Object.assign(data, result.value);
        trackUploadedMedia(data, uploaded);
      }
      return result.count;
    });
  } catch (error) {
    await media.cleanup(uploaded);
    throw error;
  }
}

export async function cleanupUnusedMedia<T extends CrmData>(store: NeonStore<T>, media: MediaStorage): Promise<number> {
  // List before locking; only the reference check and a small delete batch hold
  // the lock. Writer validation rejects revival of a previously removed key.
  const names = await media.listKeys();
  let removed = 0;
  await store.migrate(async data => {
    const before = JSON.stringify(data._mediaObjects);
    const deletable = planMediaCleanup(data, names, Date.now()).slice(0, 3);
    for (const key of deletable) {
      if (await media.removeObject(key)) {
        (data as CrmData)._mediaObjects = data._mediaObjects.filter((entry: MediaEntry) => entry.key !== key);
        removed++;
      }
    }
    return before !== JSON.stringify(data._mediaObjects) ? 1 : 0;
  });
  return removed;
}
