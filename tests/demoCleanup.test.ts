import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanupImportedDemos } from '../src/server/demoCleanup';

const samplePdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n').toString('base64');
const fixture = () => ({
  users: [
    { id: 'admin', role: 'Super Admin', phone: 'private-admin-number', passwordHash: 'preserve' },
    { id: 'usr_mk_1', role: 'MK', phone: '01700000001' },
    { id: 'usr_cro_1', role: 'CRO', phone: '01800000001' },
  ],
  sessions: [{ userId: 'admin', token: 'admin-test-session' }, { userId: 'usr_mk_1', token: 'sample-session' }],
  traffics: [
    { id: 'real', email: 'person@business.invalid', pdf: { dataUrl: samplePdf }, images: ['keep'] },
    { id: 'sample', email: 'demo@example.com', pdf: { dataUrl: samplePdf } },
  ],
  leads: [{ id: 'unmarked-lead', name: 'Keep unmarked client' }],
  payments: [{ trafficId: 'real' }, { trafficId: 'sample' }],
  paymentRequests: [{ trafficId: 'sample' }],
  attendance: [{ userId: 'admin' }, { userId: 'usr_mk_1' }],
  dailyReports: [{ userId: 'usr_cro_1' }],
  nextSerial: 50,
});

test('only confirmed imported placeholders and their dependent records are removed', () => {
  const data = fixture();
  assert.ok(cleanupImportedDemos(data) > 0);
  assert.deepEqual(data.users.map(user => user.id), ['admin']);
  assert.deepEqual(data.traffics.map(row => row.id), ['real']);
  assert.equal(data.users[0].passwordHash, 'preserve');
  assert.deepEqual(data.sessions.map(row => row.userId), ['admin']);
  assert.deepEqual(data.attendance.map(row => row.userId), ['admin']);
  assert.equal(data.dailyReports.length, 0);
  assert.equal(data.payments.length, 1);
  assert.equal(data.paymentRequests.length, 0);
  assert.equal(data.leads.length, 1);
  assert.equal(data.nextSerial, 50);
});

test('the cleanup is one-time: newly created real accounts survive later startups', () => {
  const data = fixture();
  cleanupImportedDemos(data);
  data.users.push({ id: 'new-real-user', role: 'CRO', phone: 'real-number', passwordHash: 'real-hash' });
  assert.equal(cleanupImportedDemos(data), 0);
  assert.equal(data.users.length, 2);
});

test('an example-domain email alone is not permission to delete a client with a real document', () => {
  const data = fixture();
  data.traffics.push({
    id: 'preserve-document', email: 'person@example.com',
    pdf: { dataUrl: 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n' + 'real document bytes'.repeat(10)).toString('base64') },
  });
  cleanupImportedDemos(data);
  assert.ok(data.traffics.some(row => row.id === 'preserve-document'));
});

test('cleanup stops before mutation if there is no active Super Admin to retain', () => {
  const data = fixture();
  data.users = data.users.filter(user => user.role !== 'Super Admin');
  const before = JSON.stringify(data);
  assert.throws(() => cleanupImportedDemos(data), /active Super Admin/);
  assert.equal(JSON.stringify(data), before);
});
