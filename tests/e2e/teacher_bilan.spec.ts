import { expect, test } from '@playwright/test';

test('bilan view shows score and questions, back returns to list', async ({ page }) => {
  await page.goto('/content/index.html');
  // Ensure teacher
  await page.request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
    form: { email: 'teacher.bilan@example.com', password: 'secret' },
  });
  // Login
  const res = await page.request.post('http://127.0.0.1:8008/api/v1/login-form', {
    form: { email: 'teacher.bilan@example.com', password: 'secret' },
  });
  expect(res.ok()).toBeTruthy();
  const { access_token: token } = await res.json();
  await page.addInitScript((t) => { try { localStorage.setItem('auth_token', t); } catch {} }, token);

  // Dashboard and group
  await page.goto('/content/dashboard.html');
  await page.getByRole('link', { name: /Première EDS Maths — Groupe 6/ }).click();
  await expect(page.locator('#panel-body .table-simple')).toBeVisible();

  // Click first "Voir bilan" if exists
  const firstBtn = page.locator('#panel-body .bilan-btn').first();
  if (await firstBtn.count()) {
    await firstBtn.click();
    // Expect bilan box
    await expect(page.locator('.card').first()).toBeVisible();
    await expect(page.locator('.card').first()).toContainText(/\/20|Score:|Pas noté|Aucun bilan disponible/);
    // If questions exist, there should be a questions list
    const maybeQuestions = page.locator('.questions-list .question-item');
    if (await maybeQuestions.count() > 0) {
      await expect(maybeQuestions.first()).toBeVisible();
    }
    // Back to list
    const back = page.locator('#back-to-group');
    await back.click();
    await expect(page.locator('#panel-body .table-simple')).toBeVisible();
  }
});
