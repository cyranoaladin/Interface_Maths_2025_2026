import { expect, test } from '@playwright/test';

test('student goes to student dashboard and sees bilans link', async ({ page, request }) => {
  // Ensure teacher and student exist (testing endpoints require TESTING=1 on server)
  await request.post('http://127.0.0.1:8080/testing/ensure-teacher', {
    data: { email: 'teacher@example.com', password: 'secret' },
  });
  // Login student via dev if available otherwise via login-form requires known password; assume testing/dev available in E2E env
  const studentEmail = 'eleve.test.p-eds-6@example.com';
  const r = await request.post('http://127.0.0.1:8080/api/v1/login/dev', { data: { email: studentEmail } });
  expect(r.ok()).toBeTruthy();
  const body = await r.json();
  const token = body.access_token as string;

  // Store token and open dashboard
  await page.addInitScript((t) => { localStorage.setItem('auth_token', t); }, token);
  await page.goto('http://127.0.0.1:8080/student.html');
  await expect(page.locator('h1.site-title')).toHaveText(/Mon espace — Élève/);
  await expect(page.locator('#s-evals')).toBeVisible();
});

test('teacher goes to teacher dashboard and sees groups', async ({ page, request }) => {
  const r = await request.post('http://127.0.0.1:8080/api/v1/login/dev', { data: { email: 'teacher@example.com' } });
  expect(r.ok()).toBeTruthy();
  const token = (await r.json()).access_token as string;
  await page.addInitScript((t) => { localStorage.setItem('auth_token', t); }, token);
  await page.goto('http://127.0.0.1:8080/dashboard.html');
  await expect(page.locator('#teacher-groups')).toBeVisible();
});
