const CACHE_NAME = 'v20251015-04';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/assets/css/site.css',
  '/assets/js/contents.js',
  '/assets/js/theme-toggle.js',
  '/assets/js/icons.js',
  '/assets/js/hero.js',
  '/assets/js/neon-toggle.js',
  '/assets/js/levels.js',
  '/assets/js/progression.js',
  '/assets/js/sw-client.js',
  '/assets/js/sw-update.js',
  '/assets/js/auth.js',
  '/assets/js/dashboard.js',
  '/assets/contents.json',
  '/assets/contents.static.js',
  '/EDS_premiere/index.html',
  '/EDS_terminale/index.html',
  '/Maths_expertes/index.html',
  '/login.html',
  '/dashboard.html',
  '/mentions.html',
  '/credits.html',
  '/assets/img/icon.svg',
  '/EDS_premiere/Progression/index.html',
  '/EDS_premiere/Epreuve_Anticipee/index.html',
  '/EDS_terminale/Progression/index.html',
  '/Maths_expertes/Progression/index.html',
];
self.addEventListener('install', e => {
  // Pre-cache core assets and activate new SW immediately
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', e => {
  try {
    const url = new URL(e.request.url);
    if (e.request.method !== 'GET') return;
    if (url.origin !== location.origin) return;
    // Never intercept API calls; let them go straight to the network to preserve auth headers
    if (url.pathname.startsWith('/api/')) return;

    // Network-first for HTML navigations to avoid stale pages
    const isHTML = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html');
    if (isHTML) {
      e.respondWith((async () => {
        try {
          const r = await fetch(e.request);
          const copy = r.clone();
          const c = await caches.open(CACHE_NAME);
          c.put(e.request, copy);
          return r;
        } catch (err) {
          const cached = await caches.match(e.request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      })());
      return;
    }

    // Special handling: favicon fallback to SVG
    if (url.pathname === '/favicon.ico') {
      e.respondWith((async () => {
        try {
          const net = await fetch(e.request);
          if (net && net.ok) return net;
        } catch (_) {}
        try {
          const svgResp = await fetch('/assets/img/icon.svg', { cache: 'reload' });
          if (svgResp && svgResp.ok) {
            const buf = await svgResp.arrayBuffer();
            return new Response(buf, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } });
          }
        } catch (_) {}
        return new Response('', { status: 404 });
      })());
      return;
    }

    // Network-first for JS and JSON (bilans) to éviter les données périmées
    if (url.pathname.startsWith('/assets/js/') || url.pathname.endsWith('.json')) {
      e.respondWith((async () => {
        try {
          const r = await fetch(e.request);
          const c = await caches.open(CACHE_NAME);
          c.put(e.request, r.clone());
          return r;
        } catch (_) {
          const cached = await caches.match(e.request);
          return cached || new Response('', { status: 504 });
        }
      })());
      return;
    }

    // Cache-first for static assets (CSS/images), with background update
    e.respondWith((async () => {
      const cached = await caches.match(e.request);
      if (cached) return cached;
      try {
        const r = await fetch(e.request);
        const copy = r.clone();
        const c = await caches.open(CACHE_NAME);
        c.put(e.request, copy);
        return r;
      } catch (err) {
        return new Response('', { status: 504 });
      }
    })());
  } catch (err) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 504 })));
  }
});
