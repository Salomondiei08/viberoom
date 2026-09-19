import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

// Every run uses disposable data and credentials, never the local/production store.
process.env.E2E_PASSWORD ||= randomBytes(24).toString('hex');
process.env.E2E_DATA_DIR ||= mkdtempSync(path.join(tmpdir(), 'viberoom-browser-'));
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, retries: 0,
  timeout: 45000, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure', screenshot: 'only-on-failure', launchOptions: { args: ['--no-sandbox'] } },
  webServer: {
    command: process.env.E2E_PRODUCTION === 'true' ? 'npm start -- --hostname 127.0.0.1 --port 3100' : 'npm run dev -- --hostname 127.0.0.1 --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: false, timeout: 120000,
    env: { DATA_DIR: process.env.E2E_DATA_DIR, ADMIN_EMAIL: 'qa@example.test', ADMIN_PASSWORD: process.env.E2E_PASSWORD, ADMIN_PASSWORD_HASH: '', AUTH_SECRET: randomBytes(32).toString('hex'), APP_ORIGIN: 'http://127.0.0.1:3100', TRUST_PROXY: 'false' },
  },
});
