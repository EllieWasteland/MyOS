// --- Módulo del Escritorio y Ventanas ---
import { getUnifiedData } from './data.js';
import { stopTimer } from './timer.js';

let activeIcon = null;
let isAnimating = false;
const maxIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;
const restoreIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;


// --- Lógica del Reloj ---
function updateClock() {
    const clockElement = document.getElementById('clock');
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// --- Lógica de Ventanas de Aplicaciones ---
const loadAppContent = (url) => {
    const appContentFrame = document.getElementById('app-content-frame');
    const loader = document.getElementById('loader');
    appContentFrame.src = url;
    appContentFrame.onload = () => {
        loader.classList.add('hidden');
        appContentFrame.classList.remove('hidden');
    };
};

export const closeApp = (callback) => {
    const appWindow = document.getElementById('app-window');
    document.body.classList.remove('app-open');
    if (!activeIcon && appWindow.classList.contains('hidden') || isAnimating) {
        if (typeof callback === 'function') callback();
        return;
    }
    isAnimating = true;

    let startRect = {
        top: 0,
        left: 0,
        width: 0,
        height: 0
    };
    if (activeIcon) {
        const iconRect = activeIcon.getBoundingClientRect();
        startRect = {
            top: iconRect.top,
            left: iconRect.left,
            width: iconRect.width,
            height: iconRect.height
        };
    } else {
        const {
            top,
            left,
            width,
            height
        } = appWindow.getBoundingClientRect();
        startRect = {
            top,
            left,
            width,
            height
        };
    }

    appWindow.classList.add('window-animating');
    if (appWindow.classList.contains('is-maximized')) {
        appWindow.classList.remove('is-maximized');
        document.body.classList.remove('window-maximized');
        document.getElementById('maximize-window-btn').innerHTML = maxIconSVG;
    }
    appWindow.style.transition = 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)';
    appWindow.style.top = `${startRect.top}px`;
    appWindow.style.left = `${startRect.left}px`;
    appWindow.style.width = `${startRect.width}px`;
    appWindow.style.height = `${startRect.height}px`;
    appWindow.style.borderRadius = '9999px';
    appWindow.style.opacity = '0';
    setTimeout(() => {
        appWindow.classList.add('hidden');
        appWindow.classList.remove('window-animating');
        appWindow.style.cssText = '';
        appWindow.classList.add('top-4', 'left-4', 'right-4', 'bottom-20');
        document.getElementById('window-title').textContent = '';
        document.getElementById('window-icon').innerHTML = '';
        activeIcon = null;
        isAnimating = false;
        if (typeof callback === 'function') {
            callback();
        }
    }, 350);
};

export const openApp = (url, title, iconHtml, clickedIcon) => {
    if (isAnimating) return;
    document.body.classList.add('app-open');
    hideStartMenu();
    closeDrawer();

    if (activeIcon && activeIcon !== clickedIcon) {
        closeApp(() => openApp(url, title, iconHtml, clickedIcon));
        return;
    }
    if (clickedIcon && activeIcon === clickedIcon) return;

    isAnimating = true;
    activeIcon = clickedIcon;
    const appWindow = document.getElementById('app-window');
    const hasSourceIcon = clickedIcon && clickedIcon.getBoundingClientRect;
    const iconRect = hasSourceIcon ? activeIcon.getBoundingClientRect() : {
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        width: 0,
        height: 0
    };

    appWindow.style.transition = 'none';
    appWindow.style.top = `${iconRect.top}px`;
    appWindow.style.left = `${iconRect.left}px`;
    appWindow.style.width = `${iconRect.width}px`;
    appWindow.style.height = `${iconRect.height}px`;
    appWindow.style.borderRadius = hasSourceIcon ? '9999px' : '1rem';
    appWindow.style.opacity = '0';
    appWindow.classList.remove('hidden', 'top-4', 'left-4', 'right-4', 'bottom-20');
    appWindow.classList.add('window-animating');
    document.getElementById('window-title').textContent = title;
    document.getElementById('window-icon').innerHTML = iconHtml;
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('app-content-frame').classList.add('hidden');
    document.getElementById('app-content-frame').src = 'about:blank';

    requestAnimationFrame(() => {
        appWindow.style.transition = 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)';
        const finalTop = 16,
            finalLeft = 16,
            finalWidth = window.innerWidth - 32,
            finalHeight = window.innerHeight - (16 + 80);
        appWindow.style.top = `${finalTop}px`;
        appWindow.style.left = `${finalLeft}px`;
        appWindow.style.width = `${finalWidth}px`;
        appWindow.style.height = `${finalHeight}px`;
        appWindow.style.borderRadius = '';
        appWindow.style.opacity = '1';
        setTimeout(() => {
            appWindow.classList.remove('window-animating');
            appWindow.style.cssText = '';
            appWindow.classList.add('top-4', 'left-4', 'right-4', 'bottom-20');
            loadAppContent(url);
            isAnimating = false;
        }, 350);
    });
};

// --- Lógica del Menú de Inicio y Cierre de Sesión ---

async function handleLogout() {
    hideStartMenu();
    closeApp();
    stopTimer();

    document.getElementById('main-content').classList.add('opacity-0', 'pointer-events-none');

    const loginScreen = document.getElementById('login-screen');
    loginScreen.style.display = 'flex';
    setTimeout(() => {
        loginScreen.style.opacity = '1';
        loginScreen.classList.remove('pointer-events-none');
    }, 100);

    document.getElementById('animated-bg').classList.add('zoomed-in');

    const { goToLoginStep } = await import('./ui.js');
    goToLoginStep('3');
    
    const unifiedData = await getUnifiedData();
    const username = unifiedData.globalSettings.userProfile.username;
    document.getElementById('pin-greeting').textContent = `Hola, ${username}`;
    document.getElementById('pin-subtitle').textContent = "Introduce tu PIN para continuar.";
}

export async function showStartMenu() {
    const startMenu = document.getElementById('start-menu');
    if (startMenu.classList.contains('visible')) return;
    closeDrawer();
    const greetingElement = document.getElementById('greeting');
    const hour = new Date().getHours();
    
    const data = await getUnifiedData();
    const username = data.globalSettings?.userProfile?.username || 'Invitado';

    greetingElement.innerHTML = `${hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'},<br>${username}`;
    startMenu.classList.remove('hidden');
    setTimeout(() => startMenu.classList.add('visible'), 10);
}


export function hideStartMenu() {
    const startMenu = document.getElementById('start-menu');
    if (!startMenu.classList.contains('visible')) return;
    startMenu.classList.remove('visible');
    startMenu.addEventListener('transitionend', () => startMenu.classList.add('hidden'), {
        once: true
    });
}


// --- Lógica del App Drawer ---
function openDrawer() {
    const taskbar = document.getElementById('taskbar');
    if (taskbar.classList.contains('drawer-open')) return;
    hideStartMenu();
    taskbar.classList.add('drawer-open');
}

function closeDrawer() {
    const taskbar = document.getElementById('taskbar');
    if (!taskbar.classList.contains('drawer-open')) return;
    taskbar.classList.remove('drawer-open');
}


export function initDesktop() {
    // Reloj
    updateClock();
    setInterval(updateClock, 1000);

    // --- Asignación de Eventos ---
    const appIcons = document.querySelectorAll('.app-icon');
    const appWindow = document.getElementById('app-window');

    appIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            openApp(icon.dataset.url, icon.dataset.title, icon.innerHTML, icon);
        });
    });

    document.getElementById('close-window-btn').addEventListener('click', () => closeApp());
    document.getElementById('maximize-window-btn').addEventListener('click', () => {
        const isMaximized = appWindow.classList.toggle('is-maximized');
        document.body.classList.toggle('window-maximized', isMaximized);
        document.getElementById('maximize-window-btn').innerHTML = isMaximized ? restoreIconSVG : maxIconSVG;
    });

    document.getElementById('start-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await showStartMenu();
    });
    
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // App Drawer
    const taskbar = document.getElementById('taskbar');
    taskbar.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) openDrawer();
        else closeDrawer();
    }, {
        passive: false
    });

    let touchStartY = 0;
    taskbar.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, {
        passive: true
    });
    taskbar.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchStartY - touchEndY > 50) openDrawer(); // Swipe up
        else if (touchEndY - touchStartY > 50) closeDrawer(); // Swipe down
    }, {
        passive: true
    });

    // Clicks globales para cerrar menús
    document.addEventListener('click', (e) => {
        if (!document.getElementById('start-menu').contains(e.target) && !document.getElementById('start-btn').contains(e.target)) {
            hideStartMenu();
        }
        if (taskbar.classList.contains('drawer-open') && !taskbar.contains(e.target)) {
            closeDrawer();
        }
    });

    window.addEventListener('resize', async () => {
        const { renderDesktopShortcuts } = await import('./apps.js');
        await renderDesktopShortcuts();
    });
}
