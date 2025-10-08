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
  await expect(page.locator('#panel-body table')).toBeVisible();

  // Click first "Voir bilan" if exists
  const firstBtn = page.locator('#panel-body a.btn-primary').first();
  if (await firstBtn.count()) {
    await firstBtn.click();
    // Expect bilan box
    await expect(page.locator('.bilan-box')).toBeVisible();
    await expect(page.locator('.bilan-box')).toContainText(/Score:/);
    // If questions exist, there should be a questions list
    const maybeQuestions = page.locator('.questions-list');
    if (await maybeQuestions.count()) {
      await expect(maybeQuestions.locator('.question-item').first()).toBeVisible();
    }
    // Back to list
    const back = page.locator('#back-to-students');
    await back.click();
    await expect(page.locator('#panel-body table')).toBeVisible();
  }
});
