import { expect, test } from '@playwright/test';

test('teacher can view bilan and reset student password', async ({ page }) => {
  await page.goto('/content/index.html');

  // Ensure teacher
  await page.request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
    form: { email: 'teacher.actions@example.com', password: 'secret' },
  });

  // Login (form compat)
  const res = await page.request.post('http://127.0.0.1:8008/api/v1/login-form', {
    form: { email: 'teacher.actions@example.com', password: 'secret' },
  });
  expect(res.ok()).toBeTruthy();
  const { access_token: token } = await res.json();
  await page.addInitScript((t) => { try { localStorage.setItem('auth_token', t); } catch {} }, token);

  // Go to dashboard
  await page.goto('/content/dashboard.html');
  await expect(page.locator('header .site-title')).toHaveText(/Mon espace/);

  // Click first visible group
  const firstGroup = page.locator('#teacher-groups a').first();
  await expect(firstGroup).toBeVisible();
  await firstGroup.click();
  await expect(page.locator('#panel-body table')).toBeVisible();

  // Actions column should exist
  await expect(page.locator('#panel-body thead tr th', { hasText: 'Actions' })).toBeVisible();

  // Try clicking first "Voir bilan" if present; tolerate absence of JSON (shows message)
  const bilanLink = page.locator('#panel-body a.bilan-btn').first();
  if (await bilanLink.count()) {
    await bilanLink.click();
    // Either the bilan panel or a fallback message should appear
    await expect(page.locator('#panel-title')).toHaveText(/Bilan —|Bilans/);
    // Use back link if present
    const back = page.locator('#back-to-group');
    if (await back.count()) {
      await back.click();
      await expect(page.locator('#panel-body table')).toBeVisible();
    }
  }

  // Reset password action should show a toast
  const resetBtn = page.locator('#panel-body button.reset-btn').first();
  if (await resetBtn.count()) {
    // Intercept confirm dialog
    page.on('dialog', (dialog) => dialog.accept());
    await resetBtn.click();
    // Expect toast container to exist and be visible
    await expect(page.locator('#toast-container')).toBeVisible();
  }
});

test('teacher can view bilan (second pass) and reset password toast', async ({ page }) => {
  await page.goto('/content/index.html');

  // Ensure teacher
  await page.request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
    form: { email: 'teacher.actions@example.com', password: 'secret' },
  });

  // Login (form compat)
  const res = await page.request.post('http://127.0.0.1:8008/api/v1/login-form', {
    form: { email: 'teacher.actions@example.com', password: 'secret' },
  });
  expect(res.ok()).toBeTruthy();
  const { access_token: token } = await res.json();
  await page.addInitScript((t) => { try { localStorage.setItem('auth_token', t); } catch {} }, token);

  // Go to dashboard
  await page.goto('/content/dashboard.html');
  await expect(page.locator('header .site-title')).toHaveText(/Mon espace/);

  // Click first visible group
  const firstGroup = page.locator('#teacher-groups a').first();
  await expect(firstGroup).toBeVisible();
  await firstGroup.click();
  await expect(page.locator('#panel-body table')).toBeVisible();

  // Actions column should exist
  await expect(page.locator('#panel-body thead tr th', { hasText: 'Actions' })).toBeVisible();

  // Try clicking first "Voir bilan" if present; tolerate absence of JSON (shows message)
  const bilanLink = page.locator('#panel-body a.bilan-btn').first();
  if (await bilanLink.count()) {
    await bilanLink.click();
    // Either the bilan panel or a fallback message should appear
    await expect(page.locator('#panel-title')).toHaveText(/Bilan —|Bilans/);
    // Use back link if present
    const back = page.locator('#back-to-group');
    if (await back.count()) {
      await back.click();
      await expect(page.locator('#panel-body table')).toBeVisible();
    }
  }

  // Reset password action should show a toast
  const resetBtn = page.locator('#panel-body button.reset-btn').first();
  if (await resetBtn.count()) {
    // Intercept confirm dialog
    page.on('dialog', (dialog) => dialog.accept());
    await resetBtn.click();
    // Expect toast container to exist and be visible
    await expect(page.locator('#toast-container')).toBeVisible();
  }
});
