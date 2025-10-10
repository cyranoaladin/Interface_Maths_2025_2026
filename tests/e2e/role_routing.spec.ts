import { expect, test } from '@playwright/test';

test('teacher can login via UI and see groups', async ({ page }) => {
  await page.goto('http://127.0.0.1:8080/login.html');
  await page.getByLabel('Adresse e‑mail').fill('alaeddine.benrhouma@ert.tn');
  await page.getByLabel('Mot de passe').fill('password123');
  await page.getByRole('button', { name: 'Connexion' }).click();
  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(page.locator('#teacher-groups')).toBeVisible();
});

test('student can login via UI and see bilans section', async ({ page, request }) => {
  // Reset a real student password using teacher token then login via UI
  const form = new URLSearchParams();
  form.set('username', 'alaeddine.benrhouma@ert.tn');
  form.set('password', 'password123');
  const tok = await request.post('http://127.0.0.1:8080/auth/token', {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: form.toString(),
  });
  expect(tok.ok()).toBeTruthy();
  const teacherToken = (await tok.json()).access_token as string;
  const studentEmail = 'yassine.kechrid-e@ert.tn';
  const reset = await request.post('http://127.0.0.1:8080/auth/reset-student-password', {
    headers: { authorization: `Bearer ${teacherToken}`, 'content-type': 'application/json' },
    data: { email: studentEmail },
  });
  expect(reset.ok()).toBeTruthy();

  await page.goto('http://127.0.0.1:8080/login.html');
  await page.getByLabel('Adresse e‑mail').fill(studentEmail);
  await page.getByLabel('Mot de passe').fill('password123');
  await page.getByRole('button', { name: 'Connexion' }).click();
  await expect(page).toHaveURL(/student\.html/);
  await expect(page.locator('#s-evals')).toBeVisible();
});
