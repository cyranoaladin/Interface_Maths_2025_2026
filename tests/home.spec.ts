import { expect, test } from '@playwright/test';

test('Homepage renders title and main nav', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Interface\s*Maths/i);
  await expect(page.getByRole('navigation')).toBeVisible();
});
