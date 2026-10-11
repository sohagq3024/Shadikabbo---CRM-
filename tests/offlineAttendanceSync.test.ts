import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueOfflineScan, getPendingOfflineScans, syncPendingScans } from '../src/utils/offlineAttendanceSync';

test('offline queue requires explicit server acknowledgements and never reports an unsaved device scan as saved', async () => {
  const names = ['localStorage', 'window', 'navigator', 'CustomEvent', 'fetch'];
  const original = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const values = new Map<string, string>();
  let failWrite = false;
  const install = (name: string, value: any) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  install('localStorage', {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => { if (failWrite) throw new Error('Device storage blocked'); values.set(key, value); },
  });
  install('navigator', { onLine: true });
  install('window', { dispatchEvent: () => {} });
  install('CustomEvent', class { constructor(_name: string, _detail: any) {} });
  try {
    const data = { userId: 'fixture-user', userName: 'Fixture', userRole: 'MK', qrCode: 'fixture', type: 'in' as const };
    const queued = enqueueOfflineScan(data);
    install('fetch', async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    assert.equal((await syncPendingScans('fixture-token')).success, false);
    assert.equal(getPendingOfflineScans().length, 1);
    install('fetch', async () => new Response(JSON.stringify({ syncedIds: [queued.id, queued.id] }), { status: 200 }));
    assert.equal((await syncPendingScans('fixture-token')).syncedCount, 1);
    assert.equal(getPendingOfflineScans().length, 0);
    const previous = [...values.values()][0];
    failWrite = true;
    assert.throws(() => enqueueOfflineScan(data), /not saved/);
    assert.equal([...values.values()][0], previous);
    failWrite = false;
    values.set('shadikabbo_offline_attendance_queue', '{corrupted');
    assert.throws(() => enqueueOfflineScan(data), /not been replaced/);
    assert.equal((await syncPendingScans('fixture-token')).success, false);
    assert.equal(values.get('shadikabbo_offline_attendance_queue'), '{corrupted');
  } finally {
    for (const name of names) {
      const descriptor = original.get(name);
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete (globalThis as any)[name];
    }
  }
});
