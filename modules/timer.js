// --- Módulo del Temporizador ---
import {
    showNotification
} from './ui.js';

let timerInterval = null;
let timerEndTime = 0;
let timerPausedTime = 0;
let isTimerPaused = false;
let totalTimerDuration = 0;

function updateTimerDisplay() {
    const timerWidgetDisplay = document.getElementById('timer-widget-display');
    const distance = timerEndTime - new Date().getTime();
    if (distance < 0) {
        stopTimer();
        showNotification(`¡El temporizador de ${totalTimerDuration} minutos ha terminado!`);
        return;
    }
    const remainingMinutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const remainingSeconds = Math.floor((distance % (1000 * 60)) / 1000);
    timerWidgetDisplay.textContent = `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function startTimer(minutes) {
    if (timerInterval) {
        showNotification("Ya hay un temporizador en curso.", true);
        return;
    }
    totalTimerDuration = minutes;
    timerEndTime = new Date().getTime() + minutes * 60 * 1000;
    isTimerPaused = false;
    timerPausedTime = 0;
    document.getElementById('timer-widget-container').classList.remove('hidden');
    document.getElementById('clock-btn').disabled = true;
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

export function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('timer-widget-container').classList.add('hidden');
    document.getElementById('timer-widget-controls').classList.add('hidden');
    document.getElementById('clock-btn').disabled = false;
    isTimerPaused = false;
    document.getElementById('timer-pause-resume-btn').textContent = 'Pausar';
}

function toggleTimerPause() {
    isTimerPaused = !isTimerPaused;
    const timerPauseResumeBtn = document.getElementById('timer-pause-resume-btn');
    const timerWidget = document.getElementById('timer-widget');
    if (isTimerPaused) {
        clearInterval(timerInterval);
        timerPausedTime = timerEndTime - new Date().getTime();
        timerPauseResumeBtn.textContent = 'Reanudar';
        timerWidget.style.animationPlayState = 'paused';
    } else {
        timerEndTime = new Date().getTime() + timerPausedTime;
        timerInterval = setInterval(updateTimerDisplay, 1000);
        timerPauseResumeBtn.textContent = 'Pausar';
        timerWidget.style.animationPlayState = 'running';
    }
}

export function initTimer() {
    const timerPopup = document.getElementById('timer-popup');
    const clockBtn = document.getElementById('clock-btn');
    const timerWidgetContainer = document.getElementById('timer-widget-container');

    clockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        timerPopup.classList.toggle('hidden');
    });

    document.querySelectorAll('.timer-preset-btn').forEach(button => {
        button.addEventListener('click', () => {
            startTimer(parseInt(button.dataset.time, 10));
            timerPopup.classList.add('hidden');
        });
    });

    timerWidgetContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('timer-widget-controls').classList.toggle('hidden');
    });

    document.getElementById('timer-pause-resume-btn').addEventListener('click', toggleTimerPause);
    document.getElementById('timer-stop-btn').addEventListener('click', stopTimer);

    document.addEventListener('click', (e) => {
        if (!timerPopup.contains(e.target) && !clockBtn.contains(e.target)) {
            timerPopup.classList.add('hidden');
        }
        if (timerWidgetContainer && !timerWidgetContainer.contains(e.target)) {
            document.getElementById('timer-widget-controls').classList.add('hidden');
        }
    });
}
