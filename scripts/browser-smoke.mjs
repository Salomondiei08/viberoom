import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import nextEnv from '@next/env';

// Credentials stay in memory. Do not enable tracing or log input values here.
nextEnv.loadEnvConfig(process.cwd());
const base = 'https://vibecode.reinvent-labs.com';
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.name));
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
  for (const width of [320, 480, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `test-results/production-landing-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link', { name: 'Espace admin' }).click();
  await page.getByLabel('Email', { exact: true }).fill(process.env.ADMIN_EMAIL);
  await page.getByLabel('Mot de passe', { exact: true }).fill(process.env.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await page.getByRole('button', { name: 'Actualiser', exact: true }).waitFor();
  await page.locator('.application-item').first().waitFor();
  const count = await page.locator('.application-item').count();
  assert.ok(count > 0);
  await page.getByRole('searchbox').fill('qa-no-real-project-match-7b9e1');
  await page.getByRole('heading', { name: 'Aucun résultat' }).waitFor();
  await page.getByRole('searchbox').fill('');
  await page.locator('.application-item').first().waitFor();
  assert.equal(await page.locator('.application-item').count(), count);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: 'test-results/production-dashboard-private-masked.png', fullPage: true, mask: [page.locator('.application-list'), page.locator('.detail-panel')] });
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await page.getByRole('button', { name: 'Se connecter', exact: true }).waitFor();
  assert.equal((await context.request.get(base + '/api/applications')).status(), 401);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ productionBrowser: 'passed', viewports: [320, 480, 1280], mobileNavigation: true, authenticatedDashboard: true, projectCount: count, search: true, logout: true, clientExceptions: errors.length }));
} finally { await browser.close(); }
