import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/content/index.html');
  // Purge SW et caches pour un état propre
  await page.evaluate(async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (_) {}
  });
});

test('accueil: titre, recherche, favoris', async ({ page }) => {
  await page.goto('/content/index.html');
  await expect(page.locator('header.site-hero h1.site-title')).toHaveText(/Interface\s*Maths/i);
  await page.getByLabel(/Rechercher une fiche/i).fill('suites');
  await expect(page.locator('#results-count')).toContainText(/résultat/);
  // Favori: cliquer sur le premier coeur s'il existe
  const firstStar = page.locator('#auto-index-body .resource-card .star-btn').first();
  if (await firstStar.count()) {
    await firstStar.click();
    // badge du header doit exister (même si vide au premier run)
    await expect(page.locator('[data-fav-badge]')).toHaveCount(1);
  }
});
