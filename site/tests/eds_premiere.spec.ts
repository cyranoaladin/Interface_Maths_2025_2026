import { expect, test } from '@playwright/test';

test('EDS Première page loads and shows heading', async ({ page }) => {
  await page.goto('/EDS_premiere/index.html');
  const heading = page.getByRole('heading', { level: 1, name: /EDS Première/i });
  await expect(heading).toBeVisible();
});
