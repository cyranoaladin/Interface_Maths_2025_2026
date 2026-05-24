import { expect, test } from '@playwright/test';

test('Homepage renders title and main nav', async ({ page }) => {
  await page.goto('/');
  const siteHeading = page.getByRole('heading', { level: 1, name: /Interface\s*Maths/i });
  await expect(siteHeading).toBeVisible();
  await expect(page.getByRole('navigation')).toBeVisible();
});
