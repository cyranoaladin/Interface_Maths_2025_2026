import { expect, test } from '@playwright/test';

test('real login to dashboard (API-served content)', async ({ page }) => {
  // Index served by FastAPI static when SERVE_STATIC=1
  await page.goto('/content/index.html');

  // Prepare backend testing data (ensure teacher and groups)
  await page.request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
    form: { email: 'teacher.test@example.com', password: 'secret' },
  });

  // Login via API and set token in localStorage for the page context
  const res = await page.request.post('http://127.0.0.1:8008/api/v1/login-form', {
    form: { email: 'teacher.test@example.com', password: 'secret' },
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  const token = data.access_token as string;
  await page.addInitScript((t) => {
    try { localStorage.setItem('auth_token', t); } catch {}
  }, token);

  // Navigate directly to dashboard
  await page.goto('/content/dashboard.html');
  await expect(page.locator('header .site-title')).toHaveText(/Mon espace/);

  // Verify sidebar has groups and clicking loads students
  const groupLink = page.getByRole('link', { name: /Terminale EDS Maths/ });
  await expect(groupLink).toBeVisible();
  await groupLink.click();
  await expect(page.locator('#panel-body table')).toBeVisible();
});
