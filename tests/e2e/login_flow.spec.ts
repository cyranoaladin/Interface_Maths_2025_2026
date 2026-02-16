import { expect, test } from '@playwright/test';

test('real login to dashboard (API-served content)', async ({ page }) => {
  const teacherEmail = 'teacher.login@example.com';
  const teacherPassword = 'secret';
  // Index served by FastAPI static when SERVE_STATIC=1
  await page.goto('/content/index.html');

  // Prepare backend testing data (ensure teacher and groups)
  await page.request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
    form: { email: teacherEmail, password: teacherPassword },
  });

  // Login via API and set token in localStorage for the page context
  const res = await page.request.post('http://127.0.0.1:8008/api/v1/login-form', {
    form: { email: teacherEmail, password: teacherPassword },
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

test('teacher journey: groups list and names not N/A', async ({ page }) => {
  await page.goto('/content/index.html');
  // Ensure teacher
  await page.request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
    form: { email: 'teacher.journey@example.com', password: 'secret' },
  });
  // Login
  const res = await page.request.post('http://127.0.0.1:8008/api/v1/login-form', {
    form: { email: 'teacher.journey@example.com', password: 'secret' },
  });
  expect(res.ok()).toBeTruthy();
  const { access_token: token } = await res.json();
  await page.addInitScript((t) => { try { localStorage.setItem('auth_token', t); } catch {} }, token);
  await page.goto('/content/dashboard.html');
  // 3 groups
  const groups = page.locator('#teacher-groups a');
  await expect(groups).toHaveCount(3, { timeout: 10000 });
  // Click Première EDS
  await page.getByRole('link', { name: /Première EDS Maths — Groupe 6/ }).click();
  await expect(page.locator('#panel-body table')).toBeVisible();
  const firstRow = page.locator('#panel-body table tbody tr').first();
  await expect(firstRow.locator('td').nth(0)).not.toContainText('N/A');
  await expect(firstRow.locator('td').nth(1)).not.toContainText('N/A');
});
