import { expect, test } from '@playwright/test';

test('index nav shows login link and dashboard after token', async ({ page }) => {
  await page.goto('/content/index.html');
  const loginLink = page.locator('#login-link');
  await expect(loginLink).toBeVisible();
  await expect(loginLink).toHaveText(/Se connecter|Mon espace/);

  // Simulate token set
  await page.addInitScript(() => {
    try { localStorage.setItem('auth_token', 'dummy'); } catch (_) {}
  });
  await page.reload();
  await expect(page.locator('#login-link')).toHaveText(/Mon espace/);
});
