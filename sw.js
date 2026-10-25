const SHELL = 'swinglab-shell-v1';
const RUNTIME = 'swinglab-runtime-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![SHELL, RUNTIME].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const modelHost = /cdn\.jsdelivr\.net|storage\.googleapis\.com/.test(url.hostname);
  if (!sameOrigin && !modelHost) return;
  const cacheName = sameOrigin ? SHELL : RUNTIME;
  e.respondWith(
    caches.open(cacheName).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
