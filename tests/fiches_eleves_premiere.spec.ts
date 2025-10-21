import { expect, test } from '@playwright/test';

test('Fiche élève Première (Second Degré) charge et affiche un titre', async ({ page }) => {
  const url = '/EDS_premiere/Second_Degre/fiche_eleve_second_degre.html';
  const res = await page.goto(url);
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
