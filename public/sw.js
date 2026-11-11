const CACHE_NAME = 'billmaster-public-v2';
const PUBLIC_PATHS = new Set(['/manifest.json']);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith('billmaster-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' || url.search || request.headers.has('authorization')) return;
  const isPublicAsset = PUBLIC_PATHS.has(url.pathname) ||
    /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2?|png|jpe?g|webp|svg)$/.test(url.pathname);
  if (!isPublicAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    const cacheControl = response.headers.get('cache-control') || '';
    if (response.ok && response.type === 'basic' && !response.redirected &&
        !/no-store|private/i.test(cacheControl) && !response.headers.has('vary')) {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
