import { test, expect } from '@playwright/test'

test('accueil: titre, recherche, favoris', async ({ page }) => {
  await page.goto('/index.html')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Interface Maths/)
  await page.getByLabel(/Rechercher une fiche/i).fill('suites')
  await expect(page.locator('#results-count')).toContainText(/résultat/)
  // Favori: cliquer sur le premier coeur s'il existe
  const firstStar = page.locator('#auto-index-body .resource-card .star-btn').first()
  if (await firstStar.count()) {
    await firstStar.click()
    // badge header peut rester vide au premier run mais ne doit pas planter
    await expect(page.locator('#fav-count')).toBeVisible()
  }
})

