import { expect, test } from '@playwright/test';

test('Fiche mémo Première (Second Degré cours) charge et affiche un titre', async ({ page }) => {
  const url = '/EDS_premiere/Second_Degre/cours_second_degre.html';
  const res = await page.goto(url);
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
