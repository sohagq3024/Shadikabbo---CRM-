import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import * as XLSX from 'xlsx';
import { transform } from 'esbuild';

const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

function atLeast(version: string, minimum: string) {
  const actual = version.split('.').map(Number);
  const required = minimum.split('.').map(Number);
  assert.equal(actual.length, 3);
  assert.ok(actual.every(Number.isInteger), `Unexpected release: ${version}`);
  for (let i = 0; i < 3; i++) {
    if (actual[i] !== required[i]) return actual[i] > required[i];
  }
  return true;
}

test('all locked SheetJS, UUID, and esbuild copies exclude the reported vulnerable releases', () => {
  const counts = { xlsx: 0, uuid: 0, esbuild: 0 };
  for (const [path, value] of Object.entries(lock.packages)) {
    const entry = value as { version: string; resolved?: string; integrity?: string };
    if (path.endsWith('/node_modules/xlsx') || path === 'node_modules/xlsx') {
      counts.xlsx++;
      assert.ok(atLeast(entry.version, '0.20.2'));
      assert.equal(entry.resolved, manifest.dependencies.xlsx);
      assert.ok(entry.resolved?.startsWith('https://cdn.sheetjs.com/'));
      assert.ok(entry.integrity?.startsWith('sha512-'));
    }
    if (path.endsWith('/node_modules/uuid') || path === 'node_modules/uuid') {
      counts.uuid++;
      assert.ok(atLeast(entry.version, '11.1.1'));
      assert.ok(!['12.0.0', '13.0.0'].includes(entry.version));
    }
    if (path.endsWith('/node_modules/esbuild') || path === 'node_modules/esbuild') {
      counts.esbuild++;
      assert.ok(atLeast(entry.version, '0.28.1'));
    }
  }
  for (const [name, count] of Object.entries(counts)) {
    assert.ok(count > 0, `Missing ${name} lock entry`);
  }
  assert.equal(lock.packages[''].devDependencies.esbuild, manifest.devDependencies.esbuild);
  assert.ok(atLeast(manifest.devDependencies.esbuild.replace(/^\^/, ''), '0.28.1'));
  assert.equal(manifest.overrides.uuid, '11.1.1');
});

test('patched SheetJS preserves spreadsheet export values and Unicode text', () => {
  assert.ok(atLeast(XLSX.version, '0.20.2'));
  const rows = [{
    'Candidate Name': 'বাংলা নাম',
    'Phone Number': '00123456789',
    'Paid (BDT)': 1500,
    'Due (BDT)': 0,
    'Payment Status': 'Paid',
  }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Traffic Records');
  const bytes = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const restored = XLSX.read(bytes, { type: 'buffer' });
  assert.deepEqual(restored.SheetNames, ['Traffic Records']);
  assert.deepEqual(XLSX.utils.sheet_to_json(restored.Sheets['Traffic Records']), rows);
});

test('UUID used by cloud storage rejects partial output buffer writes', () => {
  const uuid = require(require.resolve('uuid', {
    paths: [require.resolve('@google-cloud/storage')],
  }));
  assert.equal(uuid.validate(uuid.v4()), true);
  for (const method of ['v3', 'v5', 'v6']) {
    for (const offset of [-1, 4]) {
      const buffer = new Uint8Array(8).fill(170);
      assert.throws(() => method === 'v6'
        ? uuid[method]({}, buffer, offset)
        : uuid[method]('x', uuid[method].DNS, buffer, offset), RangeError);
      assert.deepEqual(buffer, new Uint8Array(8).fill(170));
    }
  }
});

test('patched esbuild still transforms TypeScript', async () => {
  const output = await transform('const count: number = 42;', { loader: 'ts' });
  assert.match(output.code, /const count = 42/);
});
