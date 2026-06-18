'use strict';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('./service-worker.js')
        .then((registro) => console.log('Service worker registrado:', registro))
        .catch((error) => console.error(`Registro fallido: ${error}`));
}

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('La aplicación es instalable.');
    
    const $boton = document.querySelector('#instalador');
    $boton.hidden = false;
    e.preventDefault();

    $boton.addEventListener('click', () => {
        e.prompt()
        .then((respuesta) => {
            if (respuesta.outcome === 'accepted') {
                console.log('El usuario aceptó la instalación.');
            } else {
                console.log('El usuario rechazó la instalación.');
            }
        })
        $boton.remove();
    });
})

// IndexedDB
const DB_NOMBRE = 'tareasDB';
const DB_VERSION = 1;
let tareas = [];
let db = null;

const solicitudDB = indexedDB.open(DB_NOMBRE, DB_VERSION);

solicitudDB.addEventListener('upgradeneeded', (e) => {
    console.log('Actualizando o creando base de datos...');
    console.log('- La base de datos es:', solicitudDB.result);
    const db = solicitudDB.result;

    db.createObjectStore('tareas', { 
        keyPath: 'id' ,
        autoIncrement: true,
    });
})

solicitudDB.addEventListener('success', () => {
    console.log('Base de datos abierta con éxito');
    console.log('- La base de datos es:', solicitudDB.result);

    db = solicitudDB.result;

    leerTareasDeDB();
})

solicitudDB.addEventListener('error', () => {
    console.error('No se pudo acceder a la base de datos...');
})

function leerTareasDeDB() {
    const transaccion = db.transaction(['tareas'], 'readonly');
    
    const almacen = transaccion.objectStore('tareas');
    
    const peticion = almacen.getAll();

    peticion.addEventListener('success', () => {
        tareas = peticion.result || [];
        
        if (tareas.length === 0) {
            tareas = [
                { id: Date.now(),     texto: 'Tocá el cuadrado para marcarla como completada', completada: false, prioridad: 'alta' },
                { id: Date.now() + 1, texto: 'Hacé doble clic en una tarea para editar su texto', completada: false, prioridad: 'media' },
                { id: Date.now() + 2, texto: 'Tocá los tres puntos para elegir su prioridad', completada: false, prioridad: null },
                { id: Date.now() + 3, texto: 'Esta tarea ya está completada', completada: true, prioridad: 'baja' }
            ];
            guardarTareas(); 
        }
        mostrarTareas();
    });
    peticion.addEventListener('error', () => {
        console.error('Error al leer las tareas de IndexedDB');
    });
}

function guardarTareas() {
    const transaccion = db.transaction(['tareas'], 'readwrite');
    const almacen = transaccion.objectStore('tareas');

    almacen.clear();

    tareas.forEach((tarea) => {
        almacen.put(tarea);
    });

    transaccion.addEventListener('complete', () => {
        console.log('¡Base de datos sincronizada!');
    });

    transaccion.addEventListener('error', () => {
        console.error('Error al guardar las tareas');
    });
}

// DOM
const formularioTareas = document.getElementById('formularioTareas');
const entradaTarea = document.getElementById('entradaTarea');
const listaPendientes = document.getElementById('listaTareasPendientes');
const listaCompletadas = document.getElementById('listaTareasCompletadas');
const mensajeEntradaError = document.getElementById('mensajeEntradaError');
const mensajeExito = document.getElementById('mensajeExito');
const contadorTareas = document.getElementById('contadorTareas');
const toggleCompletadas = document.getElementById('toggleCompletadas');
const seccionCompletadas = document.querySelector('.seccion-completadas');
const labelCompletadas = document.getElementById('labelCompletadas');
const btnLimpiarCompletadas = document.getElementById('btnLimpiarCompletadas');

// Filtros y estados
let filtroActivo = 'todas';
let prioridadSeleccionada = null;

const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 };

function ordenarTareas(arr) {
    return [...arr].sort((a, b) => {
        const pa = a.prioridad !== null ? (ORDEN_PRIORIDAD[a.prioridad] ?? 3) : 3;
        const pb = b.prioridad !== null ? (ORDEN_PRIORIDAD[b.prioridad] ?? 3) : 3;
        return pa - pb;
    });
}

// Selector de prioridad en línea (al hacer clic en el chip)
function activarSelectorPrioridad(chip, idTarea) {
    const selector = document.createElement('div');
    selector.classList.add('selector-prioridad-inline');

    function cerrar() {
        document.removeEventListener('click', cerrarEnClick);
    }

    function cerrarEnClick(e) {
        if (!selector.contains(e.target)) {
            cerrar();
            mostrarTareas();
        }
    }

    const opciones = [
        { valor: 'alta',  label: 'Alta',  clase: 'chip-alta' },
        { valor: 'media', label: 'Media', clase: 'chip-media' },
        { valor: 'baja',  label: 'Baja',  clase: 'chip-baja' },
        { valor: null,    label: '×',     clase: 'chip-sin-prioridad' },
    ];

    opciones.forEach(({ valor, label, clase }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.classList.add('btn-prioridad-inline', clase);
        btn.textContent = label;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            cerrar();
            const idx = tareas.findIndex(t => t.id === idTarea);
            if (idx !== -1) {
                tareas[idx].prioridad = valor;
                guardarTareas();
            }
            mostrarTareas();
        });
        selector.append(btn);
    });

    chip.replaceWith(selector);
    setTimeout(() => document.addEventListener('click', cerrarEnClick), 0);
}

// Crea el chip de prioridad 
function crearChip(tarea) {
    const chip = document.createElement('span');
    chip.classList.add('chip-prioridad');

    if (tarea.prioridad) {
        chip.classList.add(`chip-${tarea.prioridad}`);
        const nombres = { alta: 'Alta', media: 'Media', baja: 'Baja' };
        chip.textContent = nombres[tarea.prioridad];
    } else {
        chip.classList.add('chip-sin-prioridad');
        chip.textContent = '···';
        chip.title = 'Agregar prioridad';
    }

    chip.addEventListener('click', (e) => {
        e.stopPropagation();
        activarSelectorPrioridad(chip, tarea.id);
    });

    return chip;
}

function crearItemTarea(tarea) {
    const li = document.createElement('li');
    li.classList.add('item-tarea');
    li.dataset.id = tarea.id;
    if (tarea.completada) li.classList.add('completada');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('checkbox-tarea');
    checkbox.checked = tarea.completada;
    checkbox.setAttribute('aria-label', tarea.completada ? 'Marcar como pendiente' : 'Completar tarea');

    const chip = crearChip(tarea);

    const parrafo = document.createElement('p');
    parrafo.classList.add('texto-tarea');
    parrafo.textContent = tarea.texto;
    parrafo.title = 'Doble clic para editar';

    const btnEliminar = document.createElement('button');
    btnEliminar.classList.add('boton-eliminar');
    btnEliminar.setAttribute('aria-label', 'Eliminar tarea');
    btnEliminar.textContent = '×';

    li.append(checkbox, chip, parrafo, btnEliminar);
    return li;
}

function mostrarTareas() {
    const pendientes = tareas.filter(t => !t.completada);
    const completadas = tareas.filter(t => t.completada);

    const filtradas = filtroActivo === 'todas'
        ? pendientes
        : pendientes.filter(t => t.prioridad === filtroActivo);

    listaPendientes.innerHTML = '';
    if (filtradas.length === 0) {
        const li = document.createElement('li');
        li.classList.add('mensaje-vacio');
        li.textContent = tareas.filter(t => !t.completada).length === 0
            ? 'No tenés ninguna tarea por el momento ☕'
            : 'No tenés tareas con esa prioridad 🔍';
        listaPendientes.append(li);
    } else {
        ordenarTareas(filtradas).forEach(t => listaPendientes.append(crearItemTarea(t)));
    }

    listaCompletadas.innerHTML = '';
    completadas.forEach(t => listaCompletadas.append(crearItemTarea(t)));

    labelCompletadas.textContent = `Completadas (${completadas.length})`;
    contadorTareas.textContent =
        `${pendientes.length} pendiente${pendientes.length !== 1 ? 's' : ''} · ` +
        `${completadas.length} completada${completadas.length !== 1 ? 's' : ''}`;
}

let timeoutMensaje = null;
function mostrarMensaje(elemento, texto, duracion = 4000) {
    elemento.textContent = texto;
    clearTimeout(timeoutMensaje);
    if (duracion > 0) {
        timeoutMensaje = setTimeout(() => { elemento.textContent = ''; }, duracion);
    }
}


// Agregar tarea
formularioTareas.addEventListener('submit', (e) => {
    e.preventDefault();

    const textoTarea = entradaTarea.value.trim();
    if (!textoTarea) {
        mostrarMensaje(mensajeEntradaError, '❗ Escribí una tarea antes de agregarla', 0);
        entradaTarea.focus();
        return;
    }

    mensajeEntradaError.textContent = '';

    tareas.push({
        id: Date.now(),
        texto: textoTarea,
        completada: false,
        prioridad: prioridadSeleccionada
    });

    guardarTareas();
    mostrarTareas();
    entradaTarea.value = '';
    entradaTarea.focus();

    document.querySelectorAll('.btn-prioridad').forEach(b => b.classList.remove('activo'));
    prioridadSeleccionada = null;

    mostrarMensaje(mensajeExito, '✅ Tarea agregada');
});

// Selector de prioridad del formulario
document.querySelectorAll('.btn-prioridad').forEach(btn => {
    btn.addEventListener('click', () => {
        const prioridad = btn.dataset.prioridad;
        if (prioridadSeleccionada === prioridad) {
            btn.classList.remove('activo');
            prioridadSeleccionada = null;
        } else {
            document.querySelectorAll('.btn-prioridad').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            prioridadSeleccionada = prioridad;
        }
    });
});

// Tabs de filtro
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('activo');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('activo');
        tab.setAttribute('aria-selected', 'true');
        filtroActivo = tab.dataset.filtro;
        mostrarTareas();
    });
});

// Edición de texto con doble clic
function activarEdicion(parrafo, idTarea) {
    const input = document.createElement('input');
    input.type = 'text';
    input.classList.add('input-edicion');
    input.value = parrafo.textContent;
    parrafo.replaceWith(input);
    input.focus();
    input.select();

    let guardado = false;

    function guardarEdicion() {
        if (guardado) return;
        guardado = true;
        const nuevoTexto = input.value.trim();
        const idx = tareas.findIndex(t => t.id === idTarea);
        if (idx !== -1 && nuevoTexto) {
            tareas[idx].texto = nuevoTexto;
            guardarTareas();
        }
        mostrarTareas();
    }

    input.addEventListener('blur', guardarEdicion);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); guardarEdicion(); }
        if (e.key === 'Escape') { guardado = true; mostrarTareas(); }
    });
}

// Completar y eliminar
function manejarClickLista(e) {
    const item = e.target.closest('.item-tarea');
    if (!item) return;

    const idTarea = parseInt(item.dataset.id);
    const index = tareas.findIndex(t => t.id === idTarea);
    if (index === -1) return;

    if (e.target.classList.contains('checkbox-tarea')) {
        tareas[index].completada = e.target.checked;
        guardarTareas();
        mostrarTareas();
        if (tareas[index].completada) {
            mostrarMensaje(mensajeExito, '⭐ ¡Tarea completada!');
        }
    }

    if (e.target.classList.contains('boton-eliminar')) {
        tareas.splice(index, 1);
        guardarTareas();
        mostrarTareas();
        mostrarMensaje(mensajeExito, '🗑️ Tarea eliminada');
    }
}

function manejarDblClickLista(e) {
    const parrafo = e.target.closest('.texto-tarea');
    if (!parrafo) return;
    const item = parrafo.closest('.item-tarea');
    if (!item) return;
    activarEdicion(parrafo, parseInt(item.dataset.id));
}

listaPendientes.addEventListener('click', manejarClickLista);
listaCompletadas.addEventListener('click', manejarClickLista);
listaPendientes.addEventListener('dblclick', manejarDblClickLista);
listaCompletadas.addEventListener('dblclick', manejarDblClickLista);

// Toggle sección completadas
toggleCompletadas.addEventListener('click', () => {
    const abierto = seccionCompletadas.classList.toggle('abierto');
    toggleCompletadas.setAttribute('aria-expanded', String(abierto));
});

// Limpiar completadas
btnLimpiarCompletadas.addEventListener('click', () => {
    const cantidad = tareas.filter(t => t.completada).length;
    if (cantidad === 0) return;
    tareas = tareas.filter(t => !t.completada);
    guardarTareas();
    mostrarTareas();
    mostrarMensaje(
        mensajeExito,
        `🗑️ ${cantidad} tarea${cantidad !== 1 ? 's' : ''} eliminada${cantidad !== 1 ? 's' : ''}`
    );
});

const $botonNotificaciones = document.querySelector('#habilitar-notificaciones');

if ($botonNotificaciones) {
    $botonNotificaciones.addEventListener('click', solicitarPermisoNotificaciones);
}
$boton.addEventListener('click', solicitarPermisoNotificaciones);

function solicitarPermisoNotificaciones() {
  // NOTA: Verificar el sw para notificaciones push.

  // Comprobamos si las notificaciones son soportadas por el navegador
  if ('Notification' in window) {
    console.log('👍️ Notificaciones soportadas');
  } else {
    console.log('👎️ Notificaciones no soportadas');
  }

  // Comprobamos el estado actual del permiso (Concedido o denegado):
  if (Notification.permission === 'granted') {
    console.log('👍️ Podemos enviar notificaciones.');
    return;
  }else if (Notification.permission === 'denied') {
    console.log('👎️ No podemos enviar notificaciones.');
    return;
  } else {
    console.log('❓️ El usuario todavía no decidió, por lo que le podemos mostrar la solicitud de permiso.');
  }

  // Si el estado es 'default', solicitamos el permiso:
  Notification.requestPermission().then(permiso => {
    if (permiso === 'granted') {
      console.log('👍️ Permiso de notificaciones concedido con éxito.');
      // Aquí podemos:
      // - Mostrar una notificación de bienvenida.
      // - Si es para Push Notifications, ahora es el momento de suscribir al usuario al servicio Push.
    } else if (permiso === 'denied') {
      console.warn('👎️ El usuario denegó el permiso de notificaciones.');
    } else {
      console.log('❓️ El usuario cerró la solicitud de permiso sin tomar una decisión.');
    }
  })


  // IMPORTANTE: Esta llamada debe ser en respuesta a una interacción del usuario (clic en un botón, etc.)
  // Si la llamas al cargar la página, la mayoría de los navegadores la bloquearán
};