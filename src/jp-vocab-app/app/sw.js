// app/sw.js（超シンプル版）
const CACHE = 'tango-loop-v1';
const ASSETS = [
  './',
  './index.html',
  './public/manifest.webmanifest',
  './public/icons/icon-192.png',
  './public/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // HTML はネット優先、その他はキャッシュ優先
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
  } else {
    e.respondWith(caches.match(req).then(res => res || fetch(req)));
  }
});
