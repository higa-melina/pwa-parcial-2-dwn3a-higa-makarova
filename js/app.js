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

// Manejo del DOM
const taskForm = document.querySelector('.task-form');
const taskInput = document.getElementById('taskInput');
const taskList = document.querySelector('.task-list');

let tareas = JSON.parse(localStorage.getItem('tareas')) || [
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
    localStorage.setItem('tareas', JSON.stringify(tareas));
}

function mostrarTareas() {
    taskList.innerHTML = '';

    tareas.forEach((tarea, index) => {
        const article = document.createElement('article');
        article.classList.add('task-item');

        if (tarea.completada) {
            article.classList.add('completed');
        }

        article.innerHTML = `
            <button class="star-button" aria-label="Completar tarea">
                ${tarea.completada ? '★' : '☆'}
            </button>
            <p>${tarea.texto}</p>
            <button class="delete-button" aria-label="Eliminar tarea">×</button>
        `;

        article.dataset.index = index;
        taskList.appendChild(article);
    });
}

// Para agregar tareas
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const taskText = taskInput.value.trim();

    if (taskText !== '') {
        const nuevaTarea = {
            texto: taskText,
            completada: false
        };

        tareas.push(nuevaTarea);
        guardarTareas();
        mostrarTareas();

        taskInput.value = '';
        taskInput.focus();
    }
});

// Para completar y eliminar
taskList.addEventListener('click', (e) => {
    const item = e.target.closest('.task-item');

    if (!item) {
        return;
    }

    const index = item.dataset.index;

    if (e.target.classList.contains('star-button')) {
        tareas[index].completada = !tareas[index].completada;
        guardarTareas();
        mostrarTareas();
    }

    if (e.target.classList.contains('delete-button')) {
        tareas.splice(index, 1);
        guardarTareas();
        mostrarTareas();
    }
});

mostrarTareas();