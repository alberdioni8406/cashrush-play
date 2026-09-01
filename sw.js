/**
 * CASHRUSH Service Worker — Offline caching
 */
const CACHE = 'cashrush-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/main.js',
  './js/game.js',
  './js/player.js',
  './js/obstacles.js',
  './js/collectibles.js',
  './js/powerups.js',
  './js/characters.js',
  './js/achievements.js',
  './js/storage.js',
  './js/audio.js',
  './js/config.js',
  './assets/images/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses for same-origin
        if (event.request.method === 'GET' && response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
