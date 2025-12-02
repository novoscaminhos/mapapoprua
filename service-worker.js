/* ============================================================
   SERVICE WORKER — Rede de Apoio Araraquara
   Cache offline (PWA)
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
  ROOT + "favicon.png",
  ROOT + "dados.json",
  ROOT + "markerclusterer.min.js"
];

/* INSTALAÇÃO */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ATIVAÇÃO */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* FETCH — offline first */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return (
        resp ||
        fetch(event.request).then(fetchResp => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResp.clone());
            return fetchResp;
          });
        })
      );
    })
  );
});
