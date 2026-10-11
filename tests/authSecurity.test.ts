import assert from 'node:assert/strict';
import test from 'node:test';
import { isSessionActive, SESSION_MAX_AGE_MS } from '../src/server/authSecurity';

test('sessions expire after seven days and malformed or future timestamps are rejected', () => {
  const now = Date.now();
  assert.equal(isSessionActive({ createdAt: now }, now), true);
  assert.equal(isSessionActive({ createdAt: now - SESSION_MAX_AGE_MS + 1 }, now), true);
  for (const session of [undefined, {}, { createdAt: '123' }, { createdAt: NaN },
    { createdAt: now + 1 }, { createdAt: now - SESSION_MAX_AGE_MS }]) {
    assert.equal(isSessionActive(session, now), false);
  }
});
