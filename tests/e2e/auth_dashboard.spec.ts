import { expect, test } from '@playwright/test';

test('index nav shows login link and dashboard after token', async ({ page }) => {
  await page.goto('/content/index.html');
  const loginLink = page.locator('#login-link');
  await expect(loginLink).toBeVisible();
  await expect(loginLink).toHaveText(/Se connecter|Mon espace/);

  // Simulate token set
  await page.addInitScript(() => {
    try { localStorage.setItem('auth_token', 'dummy'); } catch (_) {}
  });
  await page.reload();
  await expect(page.locator('#login-link')).toHaveText(/Mon espace/);
});

test('auth flow: wrong password, login ok, persistence, logout', async ({ page }) => {
  // Ensure teacher
  await page.request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
    form: { email: 'teacher.test@example.com', password: 'password123' },
  });

  // Wrong password -> error message
  await page.goto('/content/login.html');
  await page.fill('input[name="email"]', 'teacher.test@example.com');
  await page.fill('input[name="password"]', 'wrong');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/login\.html/);
  const noTokenAfterBadLogin = await page.evaluate(() => {
    try {
      return !localStorage.getItem('auth_token') && !sessionStorage.getItem('auth_token');
    } catch {
      return true;
    }
  });
  expect(noTokenAfterBadLogin).toBeTruthy();

  // Correct login (API path to avoid flaky form retry timing)
  const okLogin = await page.request.post('http://127.0.0.1:8008/api/v1/login-form', {
    form: { email: 'teacher.test@example.com', password: 'password123' },
  });
  expect(okLogin.ok()).toBeTruthy();
  const { access_token: token } = await okLogin.json();
  await page.addInitScript((t) => { try { localStorage.setItem('auth_token', t); } catch {} }, token);
  await page.goto('/content/dashboard.html');
  await expect(page).toHaveURL(/dashboard.html/);

  // persistence after reload
  await page.reload();
  await expect(page.locator('header .site-title')).toContainText(/Mon espace/);

  // logout
  await page.click('#logout-btn');
  await expect(page).toHaveURL(/(index|login)\.html/);
});
