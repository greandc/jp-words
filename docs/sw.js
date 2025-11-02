// app/public/sw.js
// ざっくり：インストール時に静的資産をキャッシュ、
// 取得時は cache-first（見つからなければネット）

const CACHE_VERSION = 'v4.0.5';
const CACHE_NAME = `tango-loop-${CACHE_VERSION}`;


// 今回“アプリ殻(シェル)”としてオフラインで必要なファイル
const ASSETS = [
  '../../index.html',
  '../../boot.js',
  '../../main.js',
  '../../base.css',
  '../../icons/icon-192.png',
  '../../icons/icon-512.png',
  // 必要に応じて画像・音声など
];

// Install: キャッシュを作る
self.addEventListener('install', (e) => {
  self.skipWaiting();                             // 新SWをすぐ使う（後述）
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

// Activate: 古いキャッシュを掃除＋即制御
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('twl-cache-') && k !== CACHE_NAME)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Fetch: 取り方の方針
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // 1) 画面遷移（HTML）は「ネット優先 → ダメならキャッシュ」
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        // 新しい index.html を得たら静かにキャッシュ更新（任意）
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('../../index.html')) || Response.error();
      }
    })());
    return;
  }

  // 2) ASSETS は「キャッシュ優先（即表示）→ 裏で更新」（＝速い）
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    } catch {
      return cached || Response.error();
    }
  })());
});


