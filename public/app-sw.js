/* Gift Calendar app service worker. Scope: /app
 * Pages: network first, falling back to the last saved copy when offline.
 * Built files, fonts and images: served from cache once seen.
 * Never caches API calls, checkout or payment traffic. */
const CACHE = "bbd-app-v1";
const SHELL = ["/app", "/app/calendar", "/app/people", "/app/vouchers", "/app/manifest.webmanifest", "/app/icon-192.png", "/app/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("bbd-app-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return; // Supabase, Paystack and other services always go to the network.
  if (sameOrigin && (url.pathname.startsWith("/api") || url.pathname.startsWith("/checkout"))) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/app"))),
    );
    return;
  }

  const isStatic = isFont || /\.(?:js|css|png|jpe?g|webp|svg|woff2?)$/.test(url.pathname);
  if (!isStatic) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
