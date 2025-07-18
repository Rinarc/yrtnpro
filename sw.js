// 缓存名称
const CACHE = 'yrtn-cache-v1';

// 缓存核心文件
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll([
        '/',
        '/index.html',
        '/styles.css',    // 您的主CSS文件
        '/main.js'       // 您的主JS文件
      ]))
  );
});

// 拦截请求
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});