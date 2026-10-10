/* ============================================
   Vivaha Matrimony — PWA Service Worker
   ============================================ */

const CACHE_NAME = "vivaha-pwa-v1";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// ============================================
// INSTALL — Cache core assets
// ============================================
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Precache partial fail:", err);
      });
    })
  );
});

// ============================================
// ACTIVATE — Clean old caches
// ============================================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ============================================
// FETCH — Network first, fallback to cache
// ============================================
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip external APIs (Supabase, Backend)
  if (
    request.url.includes("supabase.co") ||
    request.url.includes("supabase.in") ||
    request.url.includes("onrender.com") ||
    request.url.includes("chrome-extension") ||
    request.url.includes("google-analytics")
  ) {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for static assets
        if (
          response.ok &&
          (request.url.endsWith(".js") ||
            request.url.endsWith(".css") ||
            request.url.endsWith(".png") ||
            request.url.endsWith(".jpg") ||
            request.url.endsWith(".jpeg") ||
            request.url.endsWith(".svg") ||
            request.url.endsWith(".woff2") ||
            request.url.endsWith(".webp"))
        ) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(request).then((cached) => {
          return cached || caches.match("/index.html");
        });
      })
  );
});

// ============================================
// MESSAGE — Skip waiting for updates
// ============================================
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
