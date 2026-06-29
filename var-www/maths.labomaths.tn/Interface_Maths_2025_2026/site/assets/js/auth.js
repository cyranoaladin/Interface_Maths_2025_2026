import {
  apiFetch,
  apiJson,
  clearToken,
  dashboardPathForRole,
  fetchWithAuth,
  getMe,
  getToken,
  logout,
  saveToken,
  withBase,
} from './api-client.js';

export {
  apiFetch,
  apiJson,
  clearToken,
  fetchWithAuth,
  getMe,
  getToken,
  logout,
  saveToken,
  withBase,
};

async function loginWithPassword(email, password) {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);
  const data = await apiJson('/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  saveToken(data.access_token);
  if (data.must_change_password) {
    localStorage.setItem('first_login', '1');
  }
  const me = await getMe();
  return { ...data, me };
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const email = (formData.get('email') || formData.get('username') || '').toString().trim();
      const password = (formData.get('password') || '').toString();
      const output = document.getElementById('login-msg');
      if (output) output.textContent = 'Connexion en cours...';
      try {
        const data = await loginWithPassword(email, password);
        location.href = dashboardPathForRole(data.me.role);
      } catch (error) {
        clearToken();
        if (output) output.textContent = error.message || 'Identifiants invalides';
      }
    });
  }

  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await logout();
      location.href = withBase('/index.html');
    });
  }
});
