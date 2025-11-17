/**
 * Service Worker for PWA offline support
 */

const CACHE_NAME = 'tattoo-bath-app-v1';

// Install event - skip precaching to avoid path issues
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
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
