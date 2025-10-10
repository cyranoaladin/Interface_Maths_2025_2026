import { test, expect } from '@playwright/test'

test('EDS Première page loads and shows heading', async ({ page }) => {
  await page.goto('/EDS_premiere/index.html')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/EDS Première/i)
})
