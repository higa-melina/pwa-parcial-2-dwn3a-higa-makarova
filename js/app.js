'use strict';

// Registro del service worker para habilitar funcionalidades offline y mejorar el rendimiento de la aplicación.
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

const CLAVE_LOCALSTORAGE = 'tareas';

// Manejo del DOM
const formularioTareas = document.querySelector('.formularioTareas');
const entradaTarea = document.getElementById('entradaTarea');
const listaTareas = document.querySelector('.listaTareas');
const mensajeEntradaError = document.getElementById('mensajeEntradaError');
const mensajeExito = document.getElementById('mensajeExito');
const mensajeEliminado = document.getElementById('mensajeEliminado');

let tareas = JSON.parse(localStorage.getItem(CLAVE_LOCALSTORAGE)) || [
    {
        texto: 'Agregá una nueva tarea',
        completada: false
    },
    {
        texto: 'Tocá la estrella para marcar la tarea como completada',
        completada: false
    },
    {
        texto: 'Tocá la × para eliminar una tarea',
        completada: true
    }
];

function guardarTareas() {
    localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(tareas));
}

function mostrarTareas() {
    listaTareas.innerHTML = '';

    tareas.forEach((tarea, index) => {
        const article = document.createElement('article');
        article.classList.add('item-tarea');

        if (tarea.completada) {
            article.classList.add('completada');
        }

        article.innerHTML = `
            <button class="boton-estrella" aria-label="Completar tarea">
                ${tarea.completada ? '★' : '☆'}
            </button>
            <p>${tarea.texto}</p>
            <button class="boton-eliminar" aria-label="Eliminar tarea">×</button>
        `;

        article.dataset.index = index;
        listaTareas.appendChild(article);
    });
}

// Para agregar tareas
formularioTareas.addEventListener('submit', (e) => {
    e.preventDefault();

    const textoTarea = entradaTarea.value.trim();

    if (textoTarea === '') {
        mensajeEntradaError.textContent = '❗ Tenés que escribir una tarea antes de agregarla';
        mensajeExito.textContent = '';
        entradaTarea.focus();
        return; 
    }

    mensajeEntradaError.textContent = '';

    const nuevaTarea = {
            texto: textoTarea,
            completada: false
        };

        tareas.push(nuevaTarea);
        guardarTareas();
        mostrarTareas();
        entradaTarea.value = '';
        entradaTarea.focus();
        
        mensajeExito.textContent = '✅ Tarea agregada con éxito';
        setTimeout(() => {
        mensajeExito.textContent = '';
        }, 5000);
});

// Para completar y eliminar
listaTareas.addEventListener('click', (e) => {
    const item = e.target.closest('.item-tarea');

    if (!item) {
        return;
    }

    const index = item.dataset.index;

    if (e.target.classList.contains('boton-estrella')) {
        tareas[index].completada = !tareas[index].completada;
        guardarTareas();
        mostrarTareas();
    }

    if (e.target.classList.contains('boton-eliminar')) {
        tareas.splice(index, 1);
        guardarTareas();
        mostrarTareas();

        mensajeEliminado.textContent = '🗑️ Tarea eliminada.';
        setTimeout(() => {
            mensajeEliminado.textContent = '';
        }, 5000);
    }
});

mostrarTareas();