import { test, expect } from '@playwright/test';

test.describe('Navigation and Core Links', () => {
  test('Homepage navigation links and buttons work', async ({ page }) => {
    await page.goto('/content/index.html');

    // Header Links
    const accueilLink = page.getByRole('link', { name: 'Accueil' }).first();
    await expect(accueilLink).toBeVisible();

    const ressourcesLink = page.getByRole('link', { name: 'Ressources' }).first();
    await expect(ressourcesLink).toBeVisible();

    const loginLink = page.getByRole('link', { name: 'Se connecter' });
    if (await loginLink.count() > 0) {
      await expect(loginLink).toBeVisible();
    }

    // Main Sections
    const edsPremiereCard = page.getByRole('link', { name: /Spécialité Mathématiques Première/i });
    if (await edsPremiereCard.count() > 0) {
      await expect(edsPremiereCard).toBeVisible();
      await edsPremiereCard.click();
      await expect(page).toHaveURL(/.*EDS_premiere\.html/);
      await page.goBack();
    }

    const edsTerminaleCard = page.getByRole('link', { name: /Spécialité Mathématiques Terminale/i });
    if (await edsTerminaleCard.count() > 0) {
      await expect(edsTerminaleCard).toBeVisible();
      await edsTerminaleCard.click();
      await expect(page).toHaveURL(/.*EDS_terminale\.html/);
      await page.goBack();
    }

    // Footer Links
    const mentionsLink = page.getByRole('link', { name: 'Mentions légales' });
    if (await mentionsLink.count() > 0) {
      await mentionsLink.click();
      await expect(page).toHaveURL(/.*mentions\.html/);
      await page.goBack();
    }
  });

  test('Teacher authentication and specific tools functionality', async ({ page }) => {
    // 1. Create Teacher Session via API
    await page.request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
      form: { email: 'teacher.comprehensive@example.com', password: 'secret' },
    });
    const res = await page.request.post('http://127.0.0.1:8008/api/v1/login-form', {
      form: { email: 'teacher.comprehensive@example.com', password: 'secret' },
    });
    expect(res.ok()).toBeTruthy();
    const { access_token: token } = await res.json();

    // 2. Set token directly on page load
    await page.goto('/content/login.html');
    await page.evaluate((t) => localStorage.setItem('auth_token', t), token);

    // 3. Go to dashboard and check elements
    await page.goto('/content/dashboard.html');
    
    // Check navigation buttons for authenticated user
    const logoutBtn = page.locator('#logout-btn');
    await expect(logoutBtn).toBeVisible();

    // Check specific teacher groups
    const groups = page.locator('#teacher-groups a');
    await expect(groups.first()).toBeVisible();

    // Ensure we can logout
    await logoutBtn.click();
    await expect(page).toHaveURL(/.*index\.html/);

    // Verify token is removed
    const tokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenAfter).toBeNull();
  });
});
