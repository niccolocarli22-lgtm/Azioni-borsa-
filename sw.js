const CACHE_NAME = 'borsacarli-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap',
  'https://s3.tradingview.com/tv.js'
];

// Install: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Solo GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // API calls - network first, cache fallback
  if (event.request.url.includes('finnhub.io') || 
      event.request.url.includes('finance.yahoo.com') ||
      event.request.url.includes('tradingview.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache on network error
          return caches.match(event.request)
            .then((response) => {
              if (response) return response;
              // If not in cache, return offline page
              return new Response(
                'Offline - Dati in cache non disponibili. Riprovare quando online.',
                { status: 503, statusText: 'Service Unavailable' }
              );
            });
        })
    );
  } else {
    // Assets - cache first, network fallback
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) return response;
          return fetch(event.request)
            .then((response) => {
              // Cache new assets
              if (response.ok && !event.request.url.includes('chrome-extension')) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              return new Response('Risorsa non disponibile offline', {
                status: 404,
                statusText: 'Not Found'
              });
            });
        })
    );
  }
});

// Message handling for update notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
