// Service Worker para ATLAS ONE ERP
// Proporciona funcionalidad offline básica

const CACHE_NAME = "atlas-one-v3"
const OFFLINE_URL = "/offline.html"

// Recursos esenciales para cachear
const ESSENTIAL_RESOURCES = [
  "/",
  "/dashboard",
  "/dashboard/ventas",
  "/dashboard/stock",
  "/dashboard/compras",
  "/offline.html",
  "/manifest.json",
]

// Install event - cachea recursos esenciales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ESSENTIAL_RESOURCES.map((url) => new Request(url, { cache: "reload" })))
      })
      .then(() => self.skipWaiting())
      .catch(() => {
        // Silent fail - non-critical
      }),
  )
})

// Activate event - limpia caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event - estrategia Network First con fallback a cache
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo maneja requests del mismo origen y GET requests
  if (url.origin !== self.location.origin || request.method !== "GET") {
    return
  }

  const isNavigation = request.mode === "navigate"
  const isStaticAsset = url.pathname.startsWith("/_next/static/")
  // El resto de /_next/ (payloads RSC, datos internos) no tiene hash en el
  // nombre y puede variar por request: siempre de red, nunca se guarda.
  const isNextInternal = url.pathname.startsWith("/_next/") && !isStaticAsset

  // Los archivos de /_next/static/ tienen el hash de su contenido en el
  // nombre: si ya está en cache es válido para siempre, así que se sirve
  // directo sin tocar la red. Esto es lo que permite que la app pueda
  // arrancar (HTML + JS) estando sin conexión.
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
          }
          return response
        })
      }),
    )
    return
  }

  if (isNextInternal) {
    event.respondWith(fetch(request, { cache: "no-store" }))
    return
  }

  // Documentos de navegación y el resto de recursos propios: Network First,
  // guardando siempre la última respuesta válida (así una recarga sin
  // conexión muestra la página real que ya se visitó, no un cartel vacío).
  event.respondWith(
    fetch(request, { cache: isNavigation ? "no-store" : "default" })
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Si falla la red, intenta servir desde cache (solo como respaldo offline)
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // Si es navegación y no hay nada guardado de esa página todavía
          // (primera vez que se abre, sin conexión), muestra la página offline.
          if (isNavigation) {
            return caches.match(OFFLINE_URL)
          }

          // Para otros recursos, retorna error
          return new Response("Network error happened", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
          })
        })
      }),
  )
})

// Mensaje del cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_CACHE_STATUS") {
    caches.has(CACHE_NAME).then((hasCache) => {
      event.ports[0].postMessage({
        cached: hasCache,
        cacheName: CACHE_NAME,
      })
    })
  }
})

// Sincronización en background (si el navegador lo soporta)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-sales") {
    event.waitUntil(Promise.resolve())
  }
})
