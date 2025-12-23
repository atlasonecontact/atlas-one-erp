// Service Worker para ATLAS ONE ERP
// Proporciona funcionalidad offline básica

const CACHE_NAME = 'atlas-one-v1';
const OFFLINE_URL = '/offline.html';

// Recursos esenciales para cachear
const ESSENTIAL_RESOURCES = [
  '/',
  '/dashboard',
  '/dashboard/ventas',
  '/offline.html',
  '/manifest.json'
];

// Install event - cachea recursos esenciales
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential resources');
        return cache.addAll(ESSENTIAL_RESOURCES.map(url => new Request(url, {cache: 'reload'})));
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Failed to cache resources:', error);
      })
  );
});

// Activate event - limpia caches viejos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - estrategia Network First con fallback a cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo maneja requests del mismo origen
  if (url.origin !== self.location.origin) {
    return;
  }

  // Estrategia: Network First, fallback to Cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la respuesta es válida, clona y guarda en cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intenta servir desde cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Si es navegación y no hay cache, muestra página offline
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Para otros recursos, retorna error
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' },
            });
          });
      })
  );
});

// Mensaje del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.has(CACHE_NAME).then((hasCache) => {
      event.ports[0].postMessage({
        cached: hasCache,
        cacheName: CACHE_NAME
      });
    });
  }
});

// Sincronización en background (si el navegador lo soporta)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-sales') {
    event.waitUntil(
      // Aquí podrías implementar lógica de sincronización
      Promise.resolve()
    );
  }
});

console.log('[SW] Service Worker loaded');
