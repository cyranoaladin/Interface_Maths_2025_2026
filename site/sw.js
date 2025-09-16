const CACHE_NAME = 'maths-site-v3'
const ASSETS = [
  '/',
  '/index.html',
  '/assets/css/site.css',
  '/assets/js/contents.js',
]
self.addEventListener('install', e => {
  // Pre-cache core assets and activate new SW immediately
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE_NAME).map(k => caches.delete(k))))
  )
  self.clients.claim()
})
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET') return
  if (url.origin !== location.origin) return

  // Network-first for HTML navigations to avoid stale pages
  const isHTML = e.request.mode === 'navigate' || (e.request.headers.get('accept')||'').includes('text/html')
  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone()
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy))
        return r
      }).catch(() => caches.match(e.request))
    )
    return
  }

  // Cache-first for static assets (CSS/JS/images), with background update
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request).then(r => {
      const copy = r.clone()
      caches.open(CACHE_NAME).then(c => c.put(e.request, copy))
      return r
    }))
  )
})

