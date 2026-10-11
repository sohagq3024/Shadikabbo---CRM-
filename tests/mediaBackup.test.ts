import test from 'node:test';
import assert from 'node:assert/strict';
import { MediaStorage, MediaError } from '../src/server/mediaStorage';

const key = '12345678-1234-1234-1234-123456789abc.png';
test('cloud backups include actual file bytes and preserve shared references without exposing private URLs', async () => {
  const bytes = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  let downloads = 0;
  const media = new MediaStorage({
    downloadAsBytes: async (name: string) => { assert.equal(name, key); downloads++; return { ok: true, value: [bytes] }; },
  } as any);
  const result = await media.inlineBackup({
    images: ['replit-media:' + key],
    payment: { images: ['/media/' + key] },
    notes: 'data: is ordinary text, not a customer file',
  });
  const uri = 'data:image/png;base64,' + bytes.toString('base64');
  assert.equal(result.images[0], uri);
  assert.equal(result.payment.images[0], uri);
  assert.equal(downloads, 1);
  assert.match(result.notes, /ordinary text/);
});

test('a missing cloud file prevents a misleading partial backup', async () => {
  const media = new MediaStorage({ downloadAsBytes: async () => ({ ok: false }) } as any);
  await assert.rejects(
    media.inlineBackup({ images: ['replit-media:' + key] }),
    (error: unknown) => error instanceof MediaError && error.status === 503 && /No partial backup/.test(error.message),
  );
});
