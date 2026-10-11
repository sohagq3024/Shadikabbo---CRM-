import test from 'node:test';
import assert from 'node:assert/strict';
import { collectMediaKeys, planMediaCleanup, trackUploadedMedia, UNUSED_FILE_GRACE_MS } from '../src/server/mediaLifecycle';
import { hashPassword, verifyPassword } from '../src/server/passwords';
import { createHash } from 'node:crypto';

const shared = '12345678-1234-1234-1234-123456789abc.png';
const orphan = '22345678-1234-1234-1234-123456789abc.pdf';
const now = Date.now();

test('shared client/payment/trash attachments are protected from garbage collection', () => {
  const data: Record<string, any> = {
    traffics: [], payments: [{ images: ['replit-media:' + shared] }],
    trash: [{ pdf: { dataUrl: '/media/' + orphan } }],
    _mediaObjects: [{ key: shared, firstSeenAt: 0, unusedSince: 0 }, { key: orphan, firstSeenAt: 0, unusedSince: 0 }],
  };
  assert.deepEqual(planMediaCleanup(data, [shared, orphan, 'unrelated-file.txt'], now), []);
  assert.equal(collectMediaKeys(data).size, 2);
  assert.equal(data._mediaObjects.length, 2);
  assert.ok(data._mediaObjects.every((entry: any) => entry.unusedSince === undefined));
});

test('unowned bucket files are never deleted; recorded CRM uploads get a full grace period', () => {
  const data: Record<string, any> = {};
  assert.deepEqual(planMediaCleanup(data, [orphan], now), []);
  assert.deepEqual(planMediaCleanup(data, [orphan], now + 10 * UNUSED_FILE_GRACE_MS), []);
  assert.deepEqual(data._mediaObjects, []);
  trackUploadedMedia(data, [orphan], now);
  assert.deepEqual(planMediaCleanup(data, [orphan, shared], now), []);
  assert.deepEqual(planMediaCleanup(data, [orphan], now + UNUSED_FILE_GRACE_MS - 1), []);
  assert.deepEqual(planMediaCleanup(data, [orphan], now + UNUSED_FILE_GRACE_MS), [orphan]);
  data.leads = [{ pdf: { dataUrl: 'replit-media:' + orphan } }];
  assert.deepEqual(planMediaCleanup(data, [orphan], now + UNUSED_FILE_GRACE_MS + 1), []);
});

test('password hashes are salted, legacy credentials still work, malformed/wrong hashes do not', () => {
  const a = hashPassword('test-only-password');
  assert.notEqual(a, hashPassword('test-only-password'));
  assert.ok(verifyPassword('test-only-password', a));
  assert.equal(verifyPassword('wrong', a), false);
  const legacy = createHash('sha256').update('test-only-password_shadikabbo_salt_2026').digest('hex');
  assert.ok(verifyPassword('test-only-password', legacy));
  assert.equal(verifyPassword('wrong', legacy), false);
  assert.equal(verifyPassword('anything', 'scrypt$broken'), false);
});
