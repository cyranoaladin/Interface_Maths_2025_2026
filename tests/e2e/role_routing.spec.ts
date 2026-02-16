import { expect, test } from '@playwright/test';

test('teacher can login via UI and see groups', async ({ page }) => {
  await page.request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
    form: { email: 'teacher.routing@example.com', password: 'secret' },
  });

  const form = new URLSearchParams();
  form.set('username', 'teacher.routing@example.com');
  form.set('password', 'secret');
  const tok = await page.request.post('http://127.0.0.1:8008/auth/token', {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: form.toString(),
  });
  expect(tok.ok()).toBeTruthy();
  const teacherToken = (await tok.json()).access_token as string;

  await page.addInitScript((t) => {
    try { localStorage.setItem('auth_token', t); } catch {}
  }, teacherToken);
  await page.goto('/content/dashboard.html');
  await expect(page.locator('#teacher-groups')).toBeVisible();
});

test('student can login via UI and see bilans section', async ({ page, request }) => {
  // Seed teacher and obtain token
  await request.post('http://127.0.0.1:8008/testing/ensure-teacher', {
    form: { email: 'teacher.routing@example.com', password: 'secret' },
  });
  const form = new URLSearchParams();
  form.set('username', 'teacher.routing@example.com');
  form.set('password', 'secret');
  const tok = await request.post('http://127.0.0.1:8008/auth/token', {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: form.toString(),
  });
  expect(tok.ok()).toBeTruthy();
  const teacherToken = (await tok.json()).access_token as string;

  // Create a deterministic test student in a known group
  const seeded = await request.post('http://127.0.0.1:8008/groups/P-EDS-6/seed-test', {
    headers: { authorization: `Bearer ${teacherToken}` },
  });
  expect(seeded.ok()).toBeTruthy();
  const studentEmail = (await seeded.json()).email as string;

  // Reset to get a valid temporary password
  const reset = await request.post('http://127.0.0.1:8008/auth/reset-student-password', {
    headers: { authorization: `Bearer ${teacherToken}`, 'content-type': 'application/json' },
    data: { email: studentEmail },
  });
  expect(reset.ok()).toBeTruthy();
  const tempPassword = (await reset.json()).temp_password as string;
  expect(typeof tempPassword).toBe('string');
  expect(tempPassword.length).toBeGreaterThanOrEqual(8);

  const studentForm = new URLSearchParams();
  studentForm.set('username', studentEmail);
  studentForm.set('password', tempPassword);
  const studentTok = await request.post('http://127.0.0.1:8008/auth/token', {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: studentForm.toString(),
  });
  expect(studentTok.ok()).toBeTruthy();
  const studentToken = (await studentTok.json()).access_token as string;

  await page.addInitScript((t) => {
    try { localStorage.setItem('auth_token', t); } catch {}
  }, studentToken);
  await page.goto('/content/student.html');
  await expect(page.locator('#s-evals')).toBeVisible();
});
