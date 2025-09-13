// --- Módulo del Temporizador ---
import {
    showNotification
} from './ui.js';

// Elementos del DOM
let timerPill; // Elemento para la nueva píldora del temporizador

// Estado del temporizador
let timerInterval = null;
let timerEndTime = 0;
let timerPausedTime = 0;
let isTimerPaused = false;
let totalTimerDuration = 0;

// Estado del reloj normal
let clockInterval = null;

// Estado del calendario
let currentDate = new Date();

// --- Funciones de visualización del reloj y temporizador ---

/**
 * Actualiza el reloj principal de la barra de tareas para mostrar la hora actual.
 * Esta función es la ÚNICA que debe modificar el elemento #clock.
 */
function updateRegularClock() {
    const clockDisplay = document.getElementById('clock');
    if (!clockDisplay) return;
    const now = new Date();
    clockDisplay.textContent = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Actualiza la píldora del temporizador para mostrar el tiempo restante.
 * Esta función NUNCA debe modificar el elemento #clock.
 */
function updateTimerDisplay() {
    const distance = timerEndTime - new Date().getTime();

    if (distance < 0) {
        if (timerPill) timerPill.textContent = `Completado`;
        stopTimer(true); // El temporizador ha finalizado.
        return;
    }

    // Lógica para la píldora (tiempo restante)
    if (timerPill) {
        const remainingMinutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const remainingSeconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        timerPill.textContent = `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }
}


// --- Funciones de control del temporizador ---

/**
 * Inicia un nuevo temporizador.
 */
function startTimer(minutes) {
    if (timerInterval) {
        showNotification("Ya hay un temporizador en curso.", true);
        return;
    }

    // IMPORTANTE: El reloj principal (updateRegularClock) no se detiene.
    
    totalTimerDuration = minutes;
    timerEndTime = new Date().getTime() + minutes * 60 * 1000;
    isTimerPaused = false;
    timerPausedTime = 0;

    const clockBtn = document.getElementById('clock-btn');
    clockBtn.dataset.timerActive = "true";

    // Muestra y activa la píldora del temporizador
    if (timerPill) {
        timerPill.style.opacity = '1'; 
        timerPill.classList.add('visible');
    }

    updateTimerDisplay(); // Llamada inicial para mostrar el tiempo
    timerInterval = setInterval(updateTimerDisplay, 1000); // Inicia el contador para la píldora
    showNotification(`Temporizador de ${minutes} minutos iniciado.`);
}

/**
 * Detiene el temporizador actual.
 * @param {boolean} finished - True si el temporizador terminó, false si fue cancelado.
 */
export function stopTimer(finished = false) {
    if (!timerInterval) return;

    clearInterval(timerInterval);
    timerInterval = null;

    // Oculta la píldora del temporizador
    if (timerPill) {
        if (finished) {
            // Mantiene el mensaje "Completado" por 2 segundos antes de ocultar
            setTimeout(() => {
                timerPill.classList.remove('visible');
            }, 2000);
        } else {
            timerPill.classList.remove('visible');
        }
    }

    const clockBtn = document.getElementById('clock-btn');
    delete clockBtn.dataset.timerActive;

    isTimerPaused = false;

    if (finished) {
        showNotification(`¡El temporizador de ${totalTimerDuration} minutos ha terminado!`);
    } else if (totalTimerDuration > 0) {
        showNotification("Temporizador detenido.");
    }
    totalTimerDuration = 0;
}

/**
 * Pausa o reanuda el temporizador.
 */
function toggleTimerPause() {
    isTimerPaused = !isTimerPaused;

    if (isTimerPaused) {
        clearInterval(timerInterval);
        timerPausedTime = timerEndTime - new Date().getTime();
        if (timerPill) timerPill.style.opacity = '0.5'; // Atenúa la píldora para indicar pausa
        showNotification("Temporizador pausado.");
    } else {
        timerEndTime = new Date().getTime() + timerPausedTime;
        timerInterval = setInterval(updateTimerDisplay, 1000);
        if (timerPill) timerPill.style.opacity = '1'; // Restaura opacidad de la píldora
        showNotification("Temporizador reanudado.");
    }
}


// --- Funciones del Calendario ---
function generateCalendar(year, month) {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('month-year-display');
    if (!calendarGrid || !monthYearDisplay) return;

    calendarGrid.innerHTML = ''; // Limpiar cuadrícula anterior

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    monthYearDisplay.textContent = firstDay.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    // Añadir nombres de los días
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayNames.forEach(day => {
        const dayNameEl = document.createElement('div');
        dayNameEl.classList.add('day-name');
        dayNameEl.textContent = day;
        calendarGrid.appendChild(dayNameEl);
    });

    // Añadir celdas vacías para los primeros días de la semana
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarGrid.appendChild(document.createElement('div'));
    }

    // Añadir celdas de los días
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        dayCell.textContent = i;

        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            dayCell.classList.add('today');
        }

        calendarGrid.appendChild(dayCell);
    }
}

function updateCalendar() {
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
}

/**
 * Inicia el intervalo para el reloj principal de la barra de tareas.
 */
function initRegularClock() {
    if (clockInterval) clearInterval(clockInterval);
    updateRegularClock();
    clockInterval = setInterval(updateRegularClock, 1000);
}


// --- Inicialización ---
export function initTimer() {
    timerPill = document.getElementById('timer-pill');
    
    const timerWindow = document.getElementById('timer-window');
    const clockBtn = document.getElementById('clock-btn');
    const closeTimerBtn = document.getElementById('close-timer-window-btn');

    // Iniciar el reloj normal por defecto. Este intervalo nunca se detendrá.
    initRegularClock();

    // Evento del botón del reloj: abre la ventana si no hay temporizador activo.
    clockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!clockBtn.dataset.timerActive) {
            timerWindow.classList.toggle('hidden');
        }
    });

    // CORRECCIÓN BUG MÓVIL: Lógica de interacción con la píldora (Tap y Long Press)
    if (timerPill) {
        let pressTimer = null;
        let isLongPress = false;

        const startPress = (e) => {
            if (!clockBtn.dataset.timerActive) return;
            e.preventDefault(); 
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                // Acción para "mantener presionado": PAUSAR/REANUDAR
                toggleTimerPause();
            }, 500); // 500ms para considerar una pulsación larga
        };

        const endPress = (e) => {
            clearTimeout(pressTimer);
            // Solo ejecuta la acción de "tap" si no fue una pulsación larga.
            if (!isLongPress) {
                if (clockBtn.dataset.timerActive) {
                    // Acción para "tap": CANCELAR TEMPORIZADOR
                    stopTimer(false);
                }
            }
        };

        // Asignar los mismos listeners a eventos de mouse y táctiles.
        timerPill.addEventListener('mousedown', startPress);
        timerPill.addEventListener('touchstart', startPress, { passive: false });

        timerPill.addEventListener('mouseup', endPress);
        timerPill.addEventListener('touchend', endPress);

        // Cancelar la pulsación larga si el cursor/dedo se sale del botón.
        timerPill.addEventListener('mouseleave', () => clearTimeout(pressTimer));
        timerPill.addEventListener('touchcancel', () => clearTimeout(pressTimer));

        // Prevenir el menú contextual para que no interfiera con la pulsación larga.
        timerPill.addEventListener('contextmenu', e => e.preventDefault());
    }


    closeTimerBtn.addEventListener('click', () => {
        timerWindow.classList.add('hidden');
    });

    document.querySelectorAll('.timer-preset-btn').forEach(button => {
        button.addEventListener('click', () => {
            startTimer(parseInt(button.dataset.time, 10));
            timerWindow.classList.add('hidden');
        });
    });

    // Navegación del calendario
    document.getElementById('prev-month-btn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    updateCalendar(); // Generación inicial del calendario

    // Cerrar ventana al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (timerWindow && !timerWindow.classList.contains('hidden') && !timerWindow.contains(e.target) && !clockBtn.contains(e.target)) {
            timerWindow.classList.add('hidden');
        }
    });
}

