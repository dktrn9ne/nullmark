// ═══════════════════════════════════════════════
//  NULLMARK Service Worker v1.0.0
// ═══════════════════════════════════════════════

const CACHE_NAME = 'nullmark-v2';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-48.png',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png'
];

const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&family=Bebas+Neue&display=swap'
];

// ── INSTALL: pre-cache app shell ──────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled([
        ...APP_SHELL.map(url => cache.add(url).catch(e => console.warn('[SW] Cache miss:', url, e))),
        ...FONT_URLS.map(url => cache.add(url).catch(e => console.warn('[SW] Font miss:', url, e)))
      ]);
    }).then(() => {
      console.log('[SW] Installed:', CACHE);
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: purge old caches ────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;
  // Skip browser internals
  if (url.protocol === 'chrome-extension:') return;
  if (url.protocol === 'blob:') return;

  // App shell → Cache first, update in background
  const isShell = APP_SHELL.some(path =>
    url.pathname === path || url.pathname === '/' || url.pathname.endsWith('index.html')
  );

  if (isShell || url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request)
          .then(res => {
            if (res && res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then(cache => cache.put(request, clone));
            }
            return res;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Google Fonts → Stale while revalidate
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetched = fetch(request).then(res => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Everything else → Network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── MESSAGES ──────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting — activating new version');
    self.skipWaiting();
  }
});
