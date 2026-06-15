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
const mensajeCompletado = document.getElementById('mensajeCompletado');

let tareas = JSON.parse(localStorage.getItem(CLAVE_LOCALSTORAGE)) || [
    {
        id: Date.now(),
        texto: 'Agregá una nueva tarea',
        completada: false
    },
    {
        id: Date.now() + 1,
        texto: 'Tocá la estrella para marcar la tarea como completada',
        completada: false
    },
    {
        id: Date.now() + 2,
        texto: 'Tocá la × para eliminar una tarea',
        completada: true
    }
];

function guardarTareas() {
    localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(tareas));
}

function mostrarTareas(tareasAMostrar) {
    listaTareas.innerHTML = '';

    tareasAMostrar.forEach((tarea) => {
        const li = document.createElement('li');
        li.classList.add('item-tarea');
        li.dataset.id = tarea.id;

        if (tarea.completada) {
            li.classList.add('completada');
        }

        const botonEstrella = document.createElement('button');
        botonEstrella.classList.add('boton-estrella');
        botonEstrella.setAttribute('aria-label', 'Completar tarea');
        botonEstrella.textContent = tarea.completada ? '★' : '☆';

        const parrafoTexto = document.createElement('p');
        parrafoTexto.textContent = tarea.texto; 

        const botonEliminar = document.createElement('button');
        botonEliminar.classList.add('boton-eliminar');
        botonEliminar.setAttribute('aria-label', 'Eliminar tarea');
        botonEliminar.textContent = '×';

        li.append(botonEstrella, parrafoTexto, botonEliminar);
        listaTareas.append(li);
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
            id: Date.now(),
            texto: textoTarea,
            completada: false
        };

        tareas.push(nuevaTarea);
        guardarTareas();
        mostrarTareas(tareas);
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

    const idTarea = parseInt(item.dataset.id);
    const index = tareas.findIndex(t => t.id === idTarea);
    
    if (index === -1) return;

    if (e.target.classList.contains('boton-estrella')) {
        tareas[index].completada = !tareas[index].completada;
        guardarTareas();
        mostrarTareas(tareas);

        if (tareas[index].completada === true) {
            mensajeCompletado.textContent = '⭐ ¡Felicitaciones! Tarea completada';
            setTimeout(() => {
                mensajeCompletado.textContent = '';
            }, 5000);
        }
    }

    if (e.target.classList.contains('boton-eliminar')) {
        tareas.splice(index, 1);
        guardarTareas();
        mostrarTareas(tareas);

        mensajeEliminado.textContent = '🗑️ Tarea eliminada.';
        setTimeout(() => {
            mensajeEliminado.textContent = '';
        }, 5000);
    }
});

mostrarTareas(tareas);