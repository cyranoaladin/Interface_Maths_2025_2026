const API_BASE = "/"; // same origin; backend should be served under same host or proxied

function withBase(path) {
  const base = location.pathname.startsWith('/content/') ? '/content' : '';
  return base + path;
}

export function saveToken(token) {
  try { localStorage.setItem('auth_token', token); } catch (_) {}
}

export function getToken() {
  try { return localStorage.getItem('auth_token') || ''; } catch (_) { return ''; }
}

export function clearToken() {
  try { localStorage.removeItem('auth_token'); } catch (_) {}
}

export async function fetchWithAuth(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // API endpoints should not be content-prefixed
  const isApi = path.startsWith('/api/') || path.startsWith('/auth/') || path.startsWith('/groups') || path.startsWith('/testing');
  const url = isApi ? path : withBase(path);
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    if (!location.pathname.endsWith('/login.html')) location.href = withBase('/login.html');
    throw new Error('Unauthorized');
  }
  return res;
}

// Attach login form handler if present
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const email = (fd.get('email') || fd.get('username') || '').toString();
      try {
        const res = await fetch('/api/v1/login-form', { method: 'POST', body: fd });
        if (!res.ok) { throw new Error('Échec de connexion'); }
        const data = await res.json();
        saveToken(data.access_token);
        location.href = withBase('/dashboard.html');
      } catch (err) {
        // Fallback DEV: try login/dev when TESTING=1 on server
        try {
          const res2 = await fetch('/api/v1/login/dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          if (res2.ok) {
            const data2 = await res2.json();
            saveToken(data2.access_token || '');
            location.href = withBase('/dashboard.html');
            return;
          }
        } catch (_) {}
        const out = document.getElementById('login-msg');
        if (out) out.textContent = 'Identifiants invalides';
      }
    });
  }

  const logout = document.getElementById('logout-btn');
  if (logout) {
    logout.addEventListener('click', () => {
      clearToken();
      location.href = withBase('/index.html');
    });
  }
});
