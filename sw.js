
const CACHE_NAME = 'ecos-nucleares-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/services/gameService.ts',
  '/components/Header.tsx',
  '/components/GameOutput.tsx',
  '/components/UserInput.tsx',
  '/components/GameOverOverlay.tsx',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=VT323&display=swap',
  'https://fonts.gstatic.com/s/vt323/v17/pxiKyp0ihIEF2isQFJXGdg.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
