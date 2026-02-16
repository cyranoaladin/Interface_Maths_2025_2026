const API_BASE = "/"; // same origin; backend should be served under same host or proxied

function withBase(path) {
  const base = location.pathname.startsWith('/content/') ? '/content' : '';
  return base + path;
}

export function saveToken(token) {
  try {
    sessionStorage.setItem('auth_token', token);
    // Backward compatibility during transition
    localStorage.setItem('auth_token', token);
  } catch (_) { }
}

export function getToken() {
  try {
    return (
      sessionStorage.getItem('auth_token') ||
      localStorage.getItem('auth_token') ||
      ''
    );
  } catch (_) { return ''; }
}

export function clearToken() {
  try { sessionStorage.removeItem('auth_token'); } catch (_) { }
  try { localStorage.removeItem('auth_token'); } catch (_) { }
}

export async function fetchWithAuth(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // API endpoints should not be content-prefixed
  const isApi = path.startsWith('/api/') || path.startsWith('/auth/') || path.startsWith('/groups') || path.startsWith('/testing');
  const url = isApi ? path : withBase(path);
  const res = await fetch(url, { ...options, headers, cache: isApi ? 'no-store' : (options.cache || 'default') });
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
        if (data.first_login) {
          // force password change page if provided, else redirect to dashboard which will prompt
          const next = withBase('/dashboard.html');
          localStorage.setItem('first_login', '1');
          location.href = next;
          return;
        }
        location.href = withBase('/dashboard.html');
      } catch (err) {
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
