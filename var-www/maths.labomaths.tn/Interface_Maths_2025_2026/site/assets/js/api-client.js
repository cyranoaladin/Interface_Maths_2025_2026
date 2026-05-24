export function withBase(path) {
  const base = location.pathname.startsWith('/content/') ? '/content' : '';
  return base + path;
}

export function saveToken(token) {
  try {
    localStorage.setItem('auth_token', token || '');
  } catch (_) {}
}

export function getToken() {
  try {
    return localStorage.getItem('auth_token') || '';
  } catch (_) {
    return '';
  }
}

export function clearToken() {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('first_login');
  } catch (_) {}
}

function isApiPath(path) {
  return /^(\/api\/|\/auth\/|\/groups\/?|\/resources\/|\/evaluations\/|\/teacher\/|\/admin\/|\/testing\/)/.test(path);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const url = isApiPath(path) ? path : withBase(path);
  const response = await fetch(url, {
    ...options,
    headers,
    cache: isApiPath(path) ? 'no-store' : (options.cache || 'default'),
  });
  if (response.status === 401) {
    clearToken();
    if (!location.pathname.endsWith('/login.html')) {
      location.href = withBase('/login.html');
    }
    throw new Error('Connexion expirée. Veuillez vous reconnecter.');
  }
  return response;
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && payload.detail
      ? String(payload.detail)
      : 'Requête impossible.';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function getMe() {
  return apiJson('/auth/me');
}

export async function logout() {
  try {
    await apiFetch('/api/v1/logout', { method: 'POST' });
  } catch (_) {}
  clearToken();
}

export function dashboardPathForRole(role) {
  if (role === 'student') return withBase('/student.html');
  if (role === 'admin') return withBase('/dashboard.html');
  return withBase('/dashboard.html');
}

export const fetchWithAuth = apiFetch;
