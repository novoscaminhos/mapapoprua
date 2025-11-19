/* ============================================================
   SERVICE WORKER — Rede de Apoio Araraquara (GitHub Pages FIX)
   Cache leve + seguro (não quebra navegação)
   ============================================================ */

const ROOT = "/mapapoprua/";
const CACHE_NAME = "rede-apoio-v3";

const ASSETS = [
  ROOT,
  ROOT + "index.html",
  ROOT + "style.css",
  ROOT + "script.js",
  ROOT + "manifest.json",
  ROOT + "icon-192.png",
  ROOT + "icon-512.png",
  ROOT + "placeholder.jpg"
];

/* INSTALL */
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

/* ACTIVATE */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* FETCH (Network First for HTML, Cache First for assets) */
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.mode === "navigate") {
    // HTML pages → sempre tenta baixar do servidor primeiro
    event.respondWith(
      fetch(request).catch(() => caches.match(ROOT + "index.html"))
    );
    return;
  }

  // Assets (CSS, JS, imagens)
  event.respondWith(
    caches.match(request).then(resp => {
      return (
        resp ||
        fetch(request).then(fetchResp => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, fetchResp.clone());
            return fetchResp;
          });
        })
      );
    })
  );
});
