const fs = require('fs');
const path = require('path');
const {
  APP_DIR,
  setupStrapi,
  cleanupStrapi,
  tokenApi,
  createFullAccessToken,
} = require('./helpers/strapi');

const UPLOADS_DIR = path.join(APP_DIR, 'public', 'uploads');
const listUploads = () => (fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : []);

// 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);
// Minimal DOS/PE header: enough for magic-byte sniffing to call it an executable.
const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(62), Buffer.from('PE\0\0'), Buffer.alloc(64)]);
const SH = Buffer.from('#!/bin/sh\necho pwned\n');

let api;
let before;

beforeAll(async () => {
  before = new Set(listUploads());
  await setupStrapi();
  api = tokenApi(await createFullAccessToken());
});

afterAll(async () => {
  await cleanupStrapi();
  // Remove only files this suite created (the dev uploads in public/uploads are left alone).
  for (const name of listUploads()) {
    if (!before.has(name)) fs.rmSync(path.join(UPLOADS_DIR, name), { force: true });
  }
});

test('a PNG uploads (201) and can be deleted', async () => {
  const res = await api
    .post('/api/upload')
    .attach('files', PNG, { filename: 'jest-pixel.png', contentType: 'image/png' });
  expect(res.status).toBe(201);
  expect(res.body).toHaveLength(1);
  const [file] = res.body;
  expect(file.mime).toBe('image/png');
  expect(listUploads().some((n) => n.startsWith('jest_pixel'))).toBe(true);

  const del = await api.delete(`/api/upload/files/${file.id}`);
  expect(del.status).toBe(200);
  expect((await api.get(`/api/upload/files/${file.id}`)).status).toBe(404);
});

test.each([
  ['a Windows executable', EXE, 'jest-evil.exe', 'application/x-msdownload'],
  ['a shell script', SH, 'jest-evil.sh', 'application/x-sh'],
])('%s is rejected by the deniedTypes/allowedTypes config', async (_label, buf, filename, contentType) => {
  const res = await api.post('/api/upload').attach('files', buf, { filename, contentType });
  expect(res.status).toBe(400);
  expect(res.body.error.message).toBe(`File type '${contentType}' is not allowed`);
  expect(listUploads().some((n) => n.startsWith('jest_evil'))).toBe(false);
});
