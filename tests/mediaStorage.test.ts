import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { MediaStorage, decodeMedia, mediaKey, mediaResponse } from '../src/server/mediaStorage';

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jr1sAAAAASUVORK5CYII=';
const pdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n').toString('base64');
const key = '12345678-1234-1234-1234-123456789abc.png';

function mockStorage(fail = false) {
  const files = new Map<string, Buffer>();
  const client = {
    uploadFromBytes: async (key: string, bytes: Buffer) => {
      if (fail) return { ok: false as const, error: { message: 'unavailable', statusCode: 503 } };
      files.set(key, Buffer.from(bytes));
      return { ok: true as const, value: null };
    },
    downloadAsBytes: async (key: string) => files.has(key)
      ? { ok: true as const, value: [files.get(key)!] as [Buffer] }
      : { ok: false as const, error: { message: 'missing', statusCode: 404 } },
    delete: async (key: string) => { files.delete(key); return { ok: true as const, value: null }; },
    list: async () => fail
      ? { ok: false as const, error: { message: 'unavailable', statusCode: 503 } }
      : { ok: true as const, value: [] },
  };
  return { client, files };
}

test('file verification accepts real signatures and rejects mismatched, malformed, and stub files', () => {
  assert.equal(decodeMedia(png).extension, 'png');
  assert.equal(decodeMedia(pdf).extension, 'pdf');
  assert.throws(() => decodeMedia('data:image/png;base64,' + Buffer.from('not an image').toString('base64')), /does not match/);
  assert.throws(() => decodeMedia('data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n').toString('base64')), /does not match/);
  assert.throws(() => decodeMedia('data:text/html;base64,PHNjcmlwdD4='), /supported/);
  assert.throws(() => decodeMedia('data:image/png;base64,%%%'), /supported/);
});

test('storage references render as same-origin private URLs without credentials', () => {
  assert.equal(mediaKey('replit-media:' + key), key);
  assert.equal(mediaKey('/media/../../secrets'), null);
  assert.deepEqual(mediaResponse({ images: ['replit-media:' + key], pdf: null }), { images: ['/media/' + key], pdf: null });
});

test('uploads store bytes and return references, not base64; existing links can be edited without reuploading', async () => {
  const { client, files } = mockStorage();
  const service = new MediaStorage(client);
  const result = await service.externalize({ images: [png], pdf: { name: 'file.pdf', dataUrl: pdf } });
  assert.equal(result.count, 2);
  assert.equal(files.size, 2);
  assert.ok(result.value.images[0].startsWith('replit-media:'));
  assert.ok(!JSON.stringify(result.value).includes('base64'));
  const edited = await service.externalize(mediaResponse(result.value));
  assert.equal(edited.count, 0);
  assert.equal(files.size, 2);
});

test('unavailable Object Storage fails explicitly instead of retaining uploaded bytes in the CRM', async () => {
  const { client, files } = mockStorage(true);
  const service = new MediaStorage(client);
  await assert.rejects(service.externalize({ images: [png] }), /not saved/);
  assert.equal(files.size, 0);
  assert.equal(await service.ready(), false);
});

test('notes and passwords are text, not attachment fields', async () => {
  const { client, files } = mockStorage();
  const service = new MediaStorage(client);
  const data = { note: 'data:text/plain,do not upload', password: 'data:password' };
  assert.deepEqual((await service.externalize(data)).value, data);
  assert.equal(files.size, 0);
});

test('a photo shared by a client and payment record is uploaded once and keeps the same reference', async () => {
  const { client, files } = mockStorage();
  const service = new MediaStorage(client);
  const result = await service.externalize({ traffics: [{ images: [png] }], payments: [{ images: [png] }] });
  assert.equal(result.count, 1);
  assert.equal(files.size, 1);
  assert.equal(result.value.traffics[0].images[0], result.value.payments[0].images[0]);
});

test('HTTP upload flow requires authentication, emits private media URLs, and cleans rejected uploads', async () => {
  const { client, files } = mockStorage();
  const service = new MediaStorage(client);
  const app = express();
  app.use(express.json());
  app.use(service.middleware(req => req.headers.authorization === 'Bearer test-session'));
  app.post('/save', (req, res) => res.json(req.body));
  app.post('/reject', (_req, res) => res.status(400).json({ error: 'Rejected' }));
  app.get('/media/:objectName', (req, res, next) => {
    if (req.headers.authorization !== 'Bearer test-session') return void res.status(401).end();
    next();
  }, service.download);
  const server: Server = await new Promise(resolve => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const options = { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-session' }, body: JSON.stringify({ images: [png] }) };
  try {
    const denied = await fetch(base + '/save', { ...options, headers: { 'Content-Type': 'application/json' } });
    assert.equal(denied.status, 401);
    assert.equal(files.size, 0);
    const saved = await fetch(base + '/save', options);
    assert.equal(saved.status, 200);
    assert.match(saved.headers.get('set-cookie') || '', /HttpOnly/);
    const body = await saved.json();
    assert.ok(body.images[0].startsWith('/media/'));
    assert.equal((await fetch(base + body.images[0])).status, 401);
    const downloaded = await fetch(base + body.images[0], { headers: { Authorization: 'Bearer test-session' } });
    assert.equal(downloaded.status, 200);
    assert.equal(downloaded.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), decodeMedia(png).bytes);
    const before = files.size;
    assert.equal((await fetch(base + '/reject', options)).status, 400);
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(files.size, before);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
