'use strict';

const PRECACHE_NOMBRE = 'tareas-pre-cache-v3';
const CACHE_DINAMICO_NOMBRE = 'tareas-cache-dinamico-v3';

const PRECACHE_URLS = [
    './',
    './index.html',
    './css/estilos.css',
    './js/app.js',
    './manifest.json',
    './img/favicon.png',
    './img/icon-48x48.png',
    './img/icon-72x72.png',
    './img/icon-96x96.png',
    './img/icon-128x128.png',
    './img/icon-144x144.png',
    './img/icon-152x152.png',
    './img/icon-192x192.png',
    './img/icon-256x256.png',
    './img/icon-384x384.png',
    './img/icon-512x512.png'
];

self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(PRECACHE_NOMBRE)
            .then((cache) => {
                return cache.addAll(PRECACHE_URLS);
            })
    );
});

self.addEventListener('fetch', (evento) => {
    if (!(evento.request.url.indexOf('http') === 0)) {
        return;
    }

    if (evento.request.method !== 'GET') {
        return;
    }

    evento.respondWith(
        caches.match(evento.request)
            .then((respuestaCache) => {
                if (respuestaCache !== undefined) {
                    return respuestaCache;
                }

                return fetch(evento.request)
                    .then((respuestaRed) => {
                        if (!respuestaRed || !respuestaRed.ok) {
                            return respuestaRed;
                        }

                        return caches.open(CACHE_DINAMICO_NOMBRE)
                            .then((cacheDinamica) => {
                                const respuestaRedClonada = respuestaRed.clone();
                                cacheDinamica.put(evento.request, respuestaRedClonada);
                                return respuestaRed;
                            });
                    });
            })
    );
});