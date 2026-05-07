'use strict';

const PRECACHE_NOMBRE = 'tareas-pre-cache-v1';
const CACHE_DINAMICO_NOMBRE = 'tareas-cache-dinamico-v1';

const PRECACHE_URLS = [
    './',
    './index.html',
    './css/estilos.css',
    './js/app.js',
    './manifest.json',
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