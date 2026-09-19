// Run inside the deployed container. Credentials and cookies never leave this process.
import assert from 'node:assert/strict';
const base = 'https://vibecode.reinvent-labs.com';
const request = (route, options = {}) => fetch(base + route, { ...options, signal: AbortSignal.timeout(15000) });
const home = await request('/');
assert.equal(home.status, 200);
assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
assert.equal(home.headers.get('x-frame-options'), 'DENY');
assert.ok(home.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
assert.equal((await request('/dashboard')).status, 200);
for (const route of ['/.env', '/data/applications.json', '/.git/config']) assert.equal((await request(route)).status, 404);
assert.equal((await request('/api/applications')).status, 401);
assert.equal((await request('/api/applications', { headers: { Cookie: 'viberoom_session=invalid' } })).status, 401);
const crossSite = await request('/api/auth/logout', { method: 'POST', headers: { Origin: 'https://untrusted.example' } });
assert.equal(crossSite.status, 403);
const login = await request('/api/auth/login', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
assert.equal(login.status, 200);
const setCookie = login.headers.get('set-cookie');
assert.ok(setCookie?.includes('HttpOnly') && setCookie.includes('Secure') && setCookie.toLowerCase().includes('samesite=strict'));
const Cookie = setCookie.split(';')[0];
try {
  const response = await request('/api/applications', { headers: { Cookie } });
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('cache-control')?.includes('no-store'));
  const projects = await response.json();
  assert.ok(Array.isArray(projects));
  assert.ok(projects.every(project => Number.isSafeInteger(project.id) && typeof project.name === 'string'));
  if (projects[0]) {
    const rejectedPatch = await request(`/api/applications/${projects[0].id}`, { method: 'PATCH', headers: { Cookie, Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'invalid', name: 'must-not-change' }) });
    assert.equal(rejectedPatch.status, 400);
  }
  console.log(JSON.stringify({ publicPage: 200, dashboard: 200, anonymousAccess: 401, forgedCookie: 401, crossSiteRequest: 403, authenticatedRead: 200, projectCount: projects.length, secureCookie: true, securityHeaders: true }));
} finally {
  const logout = await request('/api/auth/logout', { method: 'POST', headers: { Origin: base, Cookie } });
  assert.equal(logout.status, 200);
}
assert.equal((await request('/api/applications', { headers: { Cookie } })).status, 401);
console.log('PASS: logged-out cookie cannot access projects');
