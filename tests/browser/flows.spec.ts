import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing is responsive and accessible, and mobile admin navigation works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const width of [320, 375, 480, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/landing-${width}.png`, fullPage: true });
  }
  // TikTok owns the cross-origin player's internal markup; audit our page and iframe title.
  const accessibility = await new AxeBuilder({ page }).exclude('iframe').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link', { name: 'Espace admin' }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('submission confirms, duplicate is harmless, admin filters persist changes and logout protects data', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/dashboard');
  await page.getByLabel('Email', { exact: true }).fill('qa@example.test');
  await page.getByLabel('Mot de passe', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Les prochains projets arrivent ici' })).toBeVisible();
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await page.goto('/');
  async function fill() {
    await page.getByLabel('Ton nom', { exact: true }).fill('Test automatisé');
    await page.getByLabel('Ville, pays', { exact: true }).fill('Abidjan');
    await page.getByLabel('Nom du projet', { exact: true }).fill('Mon SaaS de test');
    await page.getByLabel('Lien du projet ou de la démo', { exact: true }).fill('https://example.test/qa-project');
    await page.getByLabel('Que veux-tu nous montrer ?', { exact: true }).fill('Un projet de test pour vérifier la confirmation et les actions administrateur.');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Envoyer le projet', exact: true }).click();
  }
  await fill();
  await expect(page.getByRole('heading', { name: 'Ton projet est bien reçu !' })).toBeVisible();
  await expect(page.getByLabel('Ton nom', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Proposer un autre projet' }).click();
  await expect(page.getByLabel('Ton nom', { exact: true })).toHaveValue('');
  await fill();
  await expect(page.getByRole('heading', { name: 'Ce projet est déjà reçu.' })).toBeVisible();
  await page.goto('/dashboard');
  await page.getByLabel('Email', { exact: true }).fill('qa@example.test');
  await page.getByLabel('Mot de passe', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Ouvrir le projet', exact: true })).toHaveAttribute('href', 'https://example.test/qa-project');
  await page.getByRole('button', { name: 'Sélectionné', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Statut enregistré.');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sélectionné', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Nouveau 0', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Aucun résultat' })).toBeVisible();
  await page.getByRole('button', { name: 'Toutes 1', exact: true }).click();
  await page.getByRole('searchbox').fill('introuvable');
  await expect(page.getByRole('heading', { name: 'Aucun résultat' })).toBeVisible();
  await page.getByRole('searchbox').fill('');
  for (const width of [320, 480, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/dashboard-${width}.png`, fullPage: true });
  }
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
  expect((await page.request.get('/api/applications')).status()).toBe(401);
  expect(errors).toEqual([]);
});

test('submission errors remain visible and preserve entered data', async ({ page }) => {
  await page.goto('/');
  await page.route('**/api/applications', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Service indisponible. Réessaie.' }) }));
  await page.getByLabel('Ton nom', { exact: true }).fill('Test réseau');
  await page.getByLabel('Ville, pays', { exact: true }).fill('Abidjan');
  await page.getByLabel('Nom du projet', { exact: true }).fill('Test erreur');
  await page.getByLabel('Lien du projet ou de la démo', { exact: true }).fill('https://example.test/error');
  await page.getByLabel('Que veux-tu nous montrer ?', { exact: true }).fill('Une description assez longue pour déclencher un vrai envoi.');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Envoyer le projet', exact: true }).click();
  await expect(page.locator('.application-form').getByRole('alert')).toHaveText('Service indisponible. Réessaie.');
  await expect(page.getByLabel('Ton nom', { exact: true })).toHaveValue('Test réseau');
  await expect(page.getByRole('button', { name: 'Envoyer le projet', exact: true })).toBeEnabled();
});
