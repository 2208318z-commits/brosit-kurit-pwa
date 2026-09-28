const CACHE_PREFIX = 'quit-smoking-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}7.1.4-1`;

function scopedUrl(path) {
  return new URL(path, self.registration.scope).toString();
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([
      scopedUrl('./'),
      scopedUrl('./manifest.json'),
      scopedUrl('./icon.png'),
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;

      if (request.mode === 'navigate') {
        const shell = await cache.match(scopedUrl('./'));
        if (shell) return shell;
      }
      throw new Error('Offline resource is not cached');
    }
  })());
});
