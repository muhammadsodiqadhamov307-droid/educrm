const CACHE_NAME = "educrm-shell-v4";
const APP_SHELL = ["/", "/manifest.webmanifest", "/app-icon.jpeg"];
const STATIC_DESTINATIONS = new Set(["document", "script", "style", "image", "font"]);
const EXCLUDED_PREFIXES = ["/api/", "/admin/", "/media/", "/static/admin/"];

function shouldBypass(url) {
  return EXCLUDED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  const isNavigation = request.mode === "navigate";
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin || shouldBypass(url)) {
    return;
  }

  if (isNavigation) {
    event.respondWith(
      fetch(request).catch(() => caches.match("/")),
    );
    return;
  }

  if (!STATIC_DESTINATIONS.has(request.destination)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        if (!response.ok || response.type !== "basic") {
          return response;
        }

        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        return response;
      });
    }),
  );
});
