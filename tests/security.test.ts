import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { POST as submit, GET as list } from '../app/api/applications/route';
import { PATCH as patch } from '../app/api/applications/[id]/route';
import { POST as login } from '../app/api/auth/login/route';
import { POST as logout } from '../app/api/auth/logout/route';
import { createSession, verifySession, sessionCookie } from '../lib/auth';
import { changeStore } from '../lib/storage';
import { canonicalProjectUrl, safeProjectUrl } from '../lib/applications';

let directory: string;
const origin = 'http://localhost:3100';
const payload = { name: 'Test Creator', location: 'Abidjan', focus: 'Application test', bio: 'Une description suffisamment longue pour tester le formulaire.', repository: 'https://example.com/my-project', consent: true };
function request(url: string, body?: unknown, cookie?: string, method = 'POST', custom: Record<string, string> = {}) {
  return new Request(origin + url, { method, headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: `viberoom_session=${cookie}` } : {}), ...custom }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'viberoom-unit-'));
  process.env.DATA_DIR = directory; process.env.APP_ORIGIN = origin;
  process.env.AUTH_SECRET = randomBytes(32).toString('hex');
  process.env.ADMIN_EMAIL = 'admin@example.test'; process.env.ADMIN_PASSWORD = randomBytes(24).toString('hex');
  delete process.env.ADMIN_PASSWORD_HASH;
});
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

test('private list and mutation reject anonymous and malformed sessions', async () => {
  for (const cookie of [undefined, 'invalid', 'x.' + 'é'.repeat(64), 'x.y.z']) {
    expect((await list(request('/api/applications', undefined, cookie, 'GET'))).status).toBe(401);
    expect((await patch(request('/api/applications/1', { status: 'Sélectionné' }, cookie, 'PATCH'), { params: Promise.resolve({ id: '1' }) })).status).toBe(401);
  }
});
test('missing signing secret fails closed', async () => {
  delete process.env.AUTH_SECRET;
  expect((await login(request('/api/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }))).status).toBe(503);
});
test('login sets secure session attributes and logout revokes copied cookie', async () => {
  const response = await login(request('/api/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }));
  expect(response.status).toBe(200);
  const header = response.headers.get('set-cookie')!;
  expect(header).toContain('HttpOnly'); expect(header.toLowerCase()).toContain('samesite=strict');
  const cookie = header.split(';')[0].split('=')[1];
  expect(await verifySession(cookie)).toBe(true);
  expect(await verifySession(cookie + '.extra')).toBe(false);
  expect(await verifySession(cookie.slice(0, -1) + (cookie.endsWith('0') ? '1' : '0'))).toBe(false);
  expect((await logout(request('/api/auth/logout', undefined, cookie))).status).toBe(200);
  expect(await verifySession(cookie)).toBe(false);
});
test('password rotation invalidates old sessions', async () => {
  const cookie = await createSession(process.env.ADMIN_EMAIL!);
  process.env.ADMIN_PASSWORD = randomBytes(24).toString('hex');
  expect(await verifySession(cookie)).toBe(false);
});
test('cookie matching cannot be bypassed with a prefixed cookie name', () => {
  expect(sessionCookie(new Request(origin, { headers: { cookie: 'evil_viberoom_session=forged' } }))).toBeUndefined();
});
test('cross-site login, logout and submission are rejected', async () => {
  for (const handler of [submit, login, logout]) expect((await handler(request('/api/test', payload, undefined, 'POST', { Origin: 'https://evil.example' }))).status).toBe(403);
});
test('invalid fields, unsafe URLs, missing consent and injected status are rejected', async () => {
  for (const body of [{ ...payload, name: {} }, { ...payload, repository: 'javascript:alert(1)' }, { ...payload, consent: false }, { ...payload, status: 'Sélectionné' }, { ...payload, bio: 'x' }, { ...payload, website: 'spam' }]) {
    expect((await submit(request('/api/applications', body))).status).toBe(400);
  }
});
test('malformed JSON and excessive bodies return controlled errors', async () => {
  const malformed = new Request(origin + '/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  expect((await submit(malformed)).status).toBe(400);
  expect((await submit(request('/api/applications', { ...payload, bio: 'a'.repeat(20000) }))).status).toBe(413);
});
test('equivalent concurrent submissions persist only once without personal-data response', async () => {
  const responses = await Promise.all(Array.from({ length: 5 }, () => submit(request('/api/applications', payload))));
  expect(responses.filter(response => response.status === 201)).toHaveLength(1);
  expect(responses.filter(response => response.status === 200)).toHaveLength(4);
  for (const response of responses) expect(await response.json()).not.toHaveProperty('name');
  expect(JSON.parse(await readFile(path.join(directory, 'applications.json'), 'utf8'))).toHaveLength(1);
});
test('simultaneous distinct projects are not lost and IDs stay unique', async () => {
  const responses = await Promise.all(Array.from({ length: 8 }, (_, i) => submit(request('/api/applications', { ...payload, repository: `https://example.com/${i}` }))));
  expect(responses.every(response => response.status === 201)).toBe(true);
  const rows = JSON.parse(await readFile(path.join(directory, 'applications.json'), 'utf8'));
  expect(rows).toHaveLength(8); expect(new Set(rows.map((item: { id: number }) => item.id)).size).toBe(8);
});
test('status API rejects mass assignment and saves a valid change', async () => {
  await submit(request('/api/applications', payload));
  const rows = JSON.parse(await readFile(path.join(directory, 'applications.json'), 'utf8'));
  const cookie = await createSession(process.env.ADMIN_EMAIL!);
  const context = { params: Promise.resolve({ id: String(rows[0].id) }) };
  expect((await patch(request('/api/applications/1', { status: 'Sélectionné', name: 'Hacked' }, cookie, 'PATCH'), context)).status).toBe(400);
  const response = await patch(request('/api/applications/1', { status: 'Sélectionné' }, cookie, 'PATCH'), context);
  expect(response.status).toBe(200); expect((await response.json()).status).toBe('Sélectionné');
});
test('corrupt storage is preserved rather than silently erased', async () => {
  const filename = path.join(directory, 'applications.json');
  await writeFile(filename, '{broken');
  const logging = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect((await submit(request('/api/applications', payload))).status).toBe(503);
  expect(await readFile(filename, 'utf8')).toBe('{broken'); logging.mockRestore();
});
test('failed transactions preserve previous contents', async () => {
  await writeFile(path.join(directory, 'example.json'), '[1]');
  await expect(changeStore<number[], void>('example.json', [], data => { data.push(2); throw new Error('failure'); })).rejects.toThrow('failure');
  expect(await readFile(path.join(directory, 'example.json'), 'utf8')).toBe('[1]');
});
test('login attempts are limited with retry guidance', async () => {
  for (let i = 0; i < 8; i++) expect((await login(request('/api/auth/login', { email: 'admin@example.test', password: 'wrong' }))).status).toBe(401);
  const response = await login(request('/api/auth/login', { email: 'admin@example.test', password: 'wrong' }));
  expect(response.status).toBe(429); expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
});
test('project URL policy rejects scripts and deduplicates tracking variations', () => {
  expect(safeProjectUrl('data:text/html,hello')).toBeUndefined();
  expect(safeProjectUrl('https://user:password@example.com')).toBeUndefined();
  expect(canonicalProjectUrl('https://www.example.com/app/?utm_source=tiktok#demo')).toBe(canonicalProjectUrl('http://example.com/app'));
});
