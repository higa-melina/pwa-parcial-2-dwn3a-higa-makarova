'use strict';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./service-worker.js')
    .then((registro) => {
      console.log('Service worker registrado:', registro);
    })
    .catch((error) => {
      console.error(`Registro fallido: ${error}`);
    });
}
