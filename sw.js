/* 起始页 Service Worker：
   - 预缓存站内核心资源，离线也能打开
   - 同源 GET 走 stale-while-revalidate（先用缓存，后台更新）
   - 跨域请求（CDN、天气/壁纸等接口）一律直接放行，不做缓存 */

const CACHE_NAME = 'startpage.v1.static-v3';
const PRECACHE_URLS = [
    './',
    './index.html',
    './css/tailwind.css',
    './js/water-effect.js',
    './fonts/Inter-latin.woff2',
    './fonts/JetBrainsMono-latin.woff2',
    './manifest.webmanifest',
    './img/icon-192.png',
    './img/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return; // 跨域资源交给网络

    event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
            const cached = await cache.match(request, { ignoreSearch: url.pathname.endsWith('/') || url.pathname.endsWith('.html') });
            const network = fetch(request).then(response => {
                if (response && response.ok) cache.put(request, response.clone());
                return response;
            }).catch(() => undefined);

            if (cached) {
                network.catch(() => undefined); // 后台更新，失败不打扰
                return cached;
            }
            const fresh = await network;
            if (fresh) return fresh;
            // 离线且无缓存时，导航请求回退到首页壳，避免浏览器裸奔错误页
            if (request.mode === 'navigate') {
                return (await cache.match('./index.html')) || Response.error();
            }
            return Response.error();
        })
    );
});
