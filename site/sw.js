const CACHE_NAME = 'maths-site-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/assets/css/site.css',
  '/assets/js/contents.js',
]
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)))
})
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE_NAME).map(k => caches.delete(k))))
  )
})
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET') return
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(resp => resp || fetch(e.request).then(r => {
        const copy = r.clone()
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy))
        return r
      }))
    )
  }
})

