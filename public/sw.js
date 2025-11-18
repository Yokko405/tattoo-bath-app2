/**
 * Service Worker for PWA offline support
 */

// キャッシュバージョンを上げて、古いキャッシュを強制削除
const CACHE_VERSION = 'v' + new Date().getTime(); // タイムスタンプで毎回新しいバージョン
const CACHE_NAME = `tattoo-bath-app-${CACHE_VERSION}`;

// Install event - skip precaching to avoid path issues
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...', CACHE_NAME);
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...', CACHE_NAME);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.includes(CACHE_VERSION))
          .map((name) => {
            console.log('Service Worker: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (Google Maps API, etc.)
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests - always fetch from network
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version
        return cachedResponse;
      }

      // Fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      });
    })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
