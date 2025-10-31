// app/public/sw.js
// ざっくり：インストール時に静的資産をキャッシュ、
// 取得時は cache-first（見つからなければネット）

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `tango-loop-${CACHE_VERSION}`;

const ASSETS = [
  // ← ここは “public からの相対パス”
  './',                     // index.html
  './index.html',
  './boot.js',
  './base.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',

  // React UMD（CDN落ち対策として任意。頻繁に変わらないのでOK）
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
];

// Install：静的ファイルをキャッシュ
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate：古いキャッシュを掃除
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// Fetch：まずキャッシュ、なければネット。ネット成功したらキャッシュへ
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // 3rd-party でもとりあえず cache-first でOK
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // GETのみ保存、OKレスポンスのみ保存
          if (req.method === 'GET' && res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          // 完全オフラインでキャッシュも無い場合は index.html を返して
          // アプリ側のルータに任せる（簡易フォールバック）
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});



