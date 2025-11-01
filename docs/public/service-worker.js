// service-worker.js
const VERSION = 'v1.0.0';               // ← 変更したらキャッシュ入れ替え
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

// プリキャッシュする最低限
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',

  // アプリ本体（必要に応じて追記）
  // 例: './app.js', './styles.css', './src/...'
];

// インストール：静的ファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// 有効化：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// フェッチ：
// 1) HTML は stale-while-revalidate 的に（オフラインでも開く）
// 2) 画像/JS/CSS はキャッシュ優先
// 3) /data/ 下のJSON等はネット優先→だめならキャッシュ（任意）
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // GET 以外はノータッチ
  if (req.method !== 'GET') return;

  // HTML (document) はネット→ダメならキャッシュ
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(req);
        return cached || caches.match('./index.html');
      }
    })());
    return;
  }

  // 画像・JS・CSS：キャッシュ優先（あれば即返す）
  if (['image', 'script', 'style'].includes(req.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // データ（例：/data/levels/*.json）
  if (url.pathname.startsWith('/data/')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || new Response('[]', { headers: { 'Content-Type': 'application/json' }});
      }
    })());
    return;
  }

  // その他はデフォルト：キャッシュフォールバック
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone());
      return res;
    } catch {
      return cached || Response.error();
    }
  })());
});

// すぐ更新したい時のメッセージ
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
