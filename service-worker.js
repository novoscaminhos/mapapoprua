/* SERVICE WORKER — Rede de Apoio Araraquara (robusto) */

const CACHE_NAME = 'rede-apoio-v2';
const ASSETS = [
  '/',              // se estiver no GitHub Pages, ajuste se necessário
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/placeholder.jpg'
];

// INSTALL (cache resiliente)
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const asset of ASSETS) {
      try {
        await cache.add(asset);
      } catch (err) {
        // não falha a instalação se algum asset não existir
        console.warn('SW: falha ao cachear', asset, err.message || err);
      }
    }
    await self.skipWaiting();
  })());
});

// ACTIVATE (clean old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

// FETCH — evitar interceptar Google Maps, gstatic, unpkg, cdnjs, etc.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // não interceptar APIs externas ou mapas (deixa ir pra rede)
  const skipHosts = ['maps.googleapis.com', 'maps.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com', 'cdn.jsdelivr.net'];
  if (skipHosts.some(h => url.hostname.includes(h))) {
    return; // deixa a requisição passar pela rede
  }

  // Rede preferencial para navegations (HTML) — para garantir página atualizada
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone().catch(()=>{}));
        return response;
      } catch (err) {
        const cached = await caches.match('/index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  // Cache-first para assets estáticos
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkResp) => {
        // somente cachear respostas ok e do mesmo origin
        if (!networkResp || networkResp.status !== 200 || networkResp.type === 'opaque') {
          return networkResp;
        }
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResp.clone()).catch(()=>{}));
        return networkResp;
      }).catch(() => {
        // fallback simples
        return caches.match('/placeholder.jpg');
      });
    })
  );
});
