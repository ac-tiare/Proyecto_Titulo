const CACHE_NAME = 'contigo-app-v2';
const CACHE_PREFIX = 'contigo-app-';
const APP_SHELL = ['/', '/index.html', '/assets/contigo-config.js'];
const STATIC_FILE =
  /\.(?:css|eot|gif|ico|jpe?g|js|json|map|mjs|otf|png|svg|ttf|webp|woff2?)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(APP_SHELL);
        const index = await cache.match('/index.html');
        if (!index) throw new Error('The app shell index.html was not cached.');
        const html = await index.text();
        const entryAssets = Array.from(
          html.matchAll(/(?:src|href)=["']([^"']+\.(?:css|js|mjs))["']/g),
          (match) => match[1],
        );
        await cache.addAll([...new Set(entryAssets)]);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) =>
          caches.open(CACHE_NAME).then((cache) => {
            if (!response.ok) return response;
            return cache.put('/index.html', response.clone()).then(() => response);
          }),
        )
        .catch(async () => (await caches.match('/index.html')) ?? Response.error()),
    );
    return;
  }

  if (!STATIC_FILE.test(url.pathname)) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) =>
          caches.open(CACHE_NAME).then((cache) => {
            if (!response.ok) return response;
            return cache.put(request, response.clone()).then(() => response);
          }),
        ),
    ),
  );
});
