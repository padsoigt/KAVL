// Service worker minimal : met en cache la coquille de l'app pour
// l'installation PWA. L'API passe toujours par le réseau (données fraîches).
const CACHE = "coach-ia-v1";
const SHELL = ["/", "/index.html", "/style.css", "/app.js", "/manifest.json", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // API : réseau uniquement (jamais de cache)
  if (url.pathname.startsWith("/api")) return;
  // Coquille : cache d'abord, réseau en repli
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
