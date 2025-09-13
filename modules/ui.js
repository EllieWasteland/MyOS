// --- Módulo de Interfaz de Usuario (UI) ---
import {
    saveUnifiedData,
    getUnifiedData
} from './data.js';
import {
    renderCustomApps,
    renderDesktopShortcuts
} from './apps.js';
import {
    stopTimer
} from './timer.js';
import {
    hideStartMenu,
    closeApp
} from './desktop.js';

// --- Funciones de Utilidad de UI ---

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

export function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('notification-visible');
    notification.style.backgroundColor = isError ? 'var(--theme-bg)' : '';
    notification.style.color = isError ? 'red' : '';

    setTimeout(() => {
        notification.classList.remove('notification-visible');
    }, 3000);
}

export function showModalAlert(message, title = 'Notificación') {
    const genericModal = document.getElementById('generic-modal');
    document.getElementById('generic-modal-title').textContent = title;
    document.getElementById('generic-modal-text').innerHTML = `<p class="text-gray-600 my-4">${message}</p>`;
    document.getElementById('generic-modal-buttons').innerHTML = `<button id="modal-ok-btn" class="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">Aceptar</button>`;
    genericModal.style.display = 'flex';
    document.getElementById('modal-ok-btn').addEventListener('click', () => {
        genericModal.style.display = 'none';
    }, {
        once: true
    });
}


export function showConfirmationModal(title, message, onConfirm) {
    const genericModal = document.getElementById('generic-modal');
    document.getElementById('generic-modal-title').textContent = title;
    document.getElementById('generic-modal-text').innerHTML = `<p class="text-gray-600 my-4">${message}</p>`;
    document.getElementById('generic-modal-buttons').innerHTML = `
        <div class="flex gap-4">
            <button id="modal-confirm-action" class="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition">Sí, Continuar</button>
            <button id="modal-cancel-action" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition">Cancelar</button>
        </div>`;
    genericModal.style.display = 'flex';

    document.getElementById('modal-confirm-action').addEventListener('click', async () => {
        // onConfirm puede ser asíncrono, así que lo esperamos.
        await onConfirm();
        genericModal.style.display = 'none';
    }, {
        once: true
    });

    document.getElementById('modal-cancel-action').addEventListener('click', () => {
        genericModal.style.display = 'none';
    }, {
        once: true
    });
}

export function showConflictModal(localData, cloudData, differences, onResolve) {
    const genericModal = document.getElementById('generic-modal');
    const recommendation = differences.cloudIsNewer ?
        '<p class="text-sm text-green-600 mt-2">Recomendación: La copia en la nube es más reciente.</p>' :
        '<p class="text-sm text-yellow-600 mt-2">Atención: Tus datos locales parecen ser más recientes.</p>';

    const summaryHTML = `
        <p class="text-gray-600 my-4">Se encontraron diferencias entre tus datos locales y la copia en la nube.</p>
        <div class="text-left text-sm bg-black/10 p-3 rounded-lg border border-pink-200">
            <p class="font-semibold mb-2">Versión Nube: <span class="font-mono text-xs">${differences.cloudVersion}</span></p>
            <p class="font-semibold">Versión Local: <span class="font-mono text-xs">${differences.localVersion}</span></p>
        </div>
        ${recommendation}
        <p class="text-gray-600 my-4">¿Qué deseas hacer?</p>`;

    document.getElementById('generic-modal-title').textContent = 'Conflicto de Sincronización';
    document.getElementById('generic-modal-text').innerHTML = summaryHTML;
    document.getElementById('generic-modal-buttons').innerHTML = `
        <div class="flex flex-col gap-3 w-full">
            <button id="modal-restore-cloud" class="w-full px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">Restaurar desde la Nube</button>
            <button id="modal-keep-local" class="w-full px-6 py-2 bg-white/80 text-gray-800 rounded-full hover:bg-white transition">Mantener mis Datos Locales</button>
            <button id="modal-cancel-sync" class="w-full px-6 py-2 text-gray-600 hover:bg-black/10 rounded-full transition">Cancelar</button>
        </div>`;
    genericModal.style.display = 'flex';

    const close = () => {
        genericModal.style.display = 'none';
    };

    document.getElementById('modal-restore-cloud').addEventListener('click', async () => {
        close();
        await onResolve(cloudData);
    }, {
        once: true
    });

    document.getElementById('modal-keep-local').addEventListener('click', close, {
        once: true
    });
    document.getElementById('modal-cancel-sync').addEventListener('click', close, {
        once: true
    });
}


// --- Lógica de Temas y Apariencia ---

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

async function updateAdaptiveTheme(imageUrl) {
    if (!imageUrl) return;
    const body = document.body;
    body.className = body.className.replace(/theme-\S+/g, ' ');

    if (typeof ColorThief === 'undefined') {
        try {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.2/color-thief.umd.js');
        } catch (error) {
            console.error("Failed to load ColorThief script:", error);
            return;
        }
    }

    const colorThief = new ColorThief();
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
        try {
            const dominantRgb = colorThief.getColor(img);
            const [h, s, l] = rgbToHsl(...dominantRgb);

            const pastelL = 0.92;
            const pastelS = Math.max(0.6, Math.min(0.95, s * 1.2));

            const accentRgb = hslToRgb(h, pastelS, pastelL);
            const accentRgbDarker = hslToRgb(h, pastelS, pastelL - 0.1);
            const textRgb = hslToRgb(h, Math.min(0.8, s * 1.2), Math.max(0, l - 0.5));

            const styleSheet = document.getElementById('dynamic-theme-styles');

            styleSheet.innerHTML = `
                :root {
                    --theme-bg-translucent: rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, 0.85);
                    --theme-bg: rgb(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]});
                    --theme-bg-hover: rgb(${accentRgbDarker[0]}, ${accentRgbDarker[1]}, ${accentRgbDarker[2]});
                    --theme-border: rgba(${textRgb[0]}, ${textRgb[1]}, ${textRgb[2]}, 0.3);
                    --theme-text: rgb(${textRgb[0]}, ${textRgb[1]}, ${textRgb[2]});
                }
            `;
        } catch (e) {
            console.error("Error generating theme from wallpaper:", e);
        }
    };
    img.onerror = () => console.error("Could not load image for color theming.");
    img.src = imageUrl;
}

async function applyManualTheme(colorName) {
    const styleSheet = document.getElementById('dynamic-theme-styles');
    styleSheet.innerHTML = '';

    const body = document.body;
    body.className = body.className.replace(/theme-\S+/g, ' ');
    body.classList.add(`theme-${colorName}`);

    const data = await getUnifiedData();
    data.myTime.manualThemeColor = colorName;
    await saveUnifiedData(data);
}

export async function applyCurrentTheme() {
    const data = await getUnifiedData();
    applyWallpaperUI(data.myTime.wallpaper);

    if (data.myTime.adaptiveTheme) {
        await updateAdaptiveTheme(data.myTime.wallpaper);
    } else {
        await applyManualTheme(data.myTime.manualThemeColor || 'pink');
    }
}

function applyWallpaperUI(base64String) {
    const defaultWallpaper = 'https://c10.patreonusercontent.com/4/patreon-media/p/post/115987106/014a2a344eb04af0bd534066629930b5/eyJiIjo3MCwidyI6MTA4MH0%3D/1.gif?token-hash=FQipZ-GoI8DzRBu_sXt6i_LBQ2HyXOnQoWoL9BBK-aU%3D';
    const imageUrl = base64String || defaultWallpaper;
    document.getElementById('animated-bg').style.backgroundImage = `url(${imageUrl})`;
}

// --- Navegación y Estado de la App ---
export async function goToLoginStep(step) {
    const steps = {
        '1': document.getElementById('login-step-1'),
        'backup': document.getElementById('login-step-backup'),
        '2': document.getElementById('login-step-2'),
        '3': document.getElementById('login-step-3')
    };

    Object.values(steps).forEach(s => {
        if (s) {
            s.style.opacity = '0';
            s.style.pointerEvents = 'none';
            s.style.transform = 'translateY(20px)';
        }
    });

    const currentStepEl = steps[step];
    if (currentStepEl) {
        setTimeout(() => {
            currentStepEl.style.opacity = '1';
            currentStepEl.style.pointerEvents = 'auto';
            currentStepEl.style.transform = 'translateY(0)';
        }, 50);
    }

    if (step === '3') {
        try {
            const {
                resetPinInput
            } = await import('./auth.js');
            resetPinInput();
        } catch (e) {
            console.error("No se pudo reiniciar la entrada de PIN:", e);
        }
    }

    if (step === '2') {
        document.getElementById('username-input').focus();
    }
}

export async function proceedToMainContent({
    isLogin,
    username,
    pin,
    pfp,
    loginMethod,
    googleProfile
}) {
    if (!isLogin) {
        const unifiedData = await getUnifiedData();
        unifiedData.globalSettings.onboardingComplete = true;
        unifiedData.globalSettings.userProfile = {
            username,
            pin,
            pfp,
            loginMethod,
            googleProfile
        };
        await saveUnifiedData(unifiedData);
    }

    await applyCurrentTheme();
    await renderCustomApps();
    await renderDesktopShortcuts();

    document.getElementById('animated-bg').classList.remove('zoomed-in');
    document.getElementById('login-screen').style.opacity = '0';
    document.getElementById('main-content').classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('greeting').innerHTML = `Hola,<br>${username}`;
    document.getElementById('start-btn').style.backgroundImage = `url(${pfp})`;
    document.getElementById('start-menu-avatar').src = pfp;
    document.getElementById('login-screen').addEventListener('transitionend', () => document.getElementById('login-screen').style.display = 'none', {
        once: true
    });
}

// --- Lógica de la Ventana de Ajustes ---
async function openSettingsWindow() {
    const data = await getUnifiedData();
    const userProfile = data.globalSettings.userProfile;

    if (userProfile && userProfile.loginMethod === 'google') {
        document.getElementById('google-account-info').classList.remove('hidden');
        document.getElementById('offline-account-info').classList.add('hidden');
        document.getElementById('settings-pfp').src = userProfile.googleProfile.picture;
        document.getElementById('settings-username').textContent = userProfile.googleProfile.name;
        document.getElementById('settings-email').textContent = userProfile.googleProfile.email;
    } else if (userProfile) {
        document.getElementById('google-account-info').classList.add('hidden');
        document.getElementById('offline-account-info').classList.remove('hidden');
        document.getElementById('settings-pfp-offline').src = userProfile.pfp;
        document.getElementById('settings-username-offline').textContent = userProfile.username;
    }

    const adaptiveToggle = document.getElementById('adaptive-mode-toggle');
    adaptiveToggle.checked = data.myTime.adaptiveTheme;
    document.getElementById('manual-color-picker').classList.toggle('hidden', adaptiveToggle.checked);

    const currentWallpaperPreview = document.getElementById('current-wallpaper-preview');
    const defaultWallpaper = 'https://c10.patreonusercontent.com/4/patreon-media/p/post/115987106/014a2a344eb04af0bd534066629930b5/eyJiIjo3MCwidyI6MTA4MH0%3D/1.gif?token-hash=FQipZ-GoI8DzRBu_sXt6i_LBQ2HyXOnQoWoL9BBK-aU%3D';
    const currentWallpaperSrc = data.myTime.wallpaper || defaultWallpaper;
    currentWallpaperPreview.innerHTML = `
        <div class="wallpaper-preview-item">
            <img src="${currentWallpaperSrc}" alt="Fondo de pantalla actual">
        </div>
    `;

    document.getElementById('settings-window').classList.remove('hidden');
}


function closeSettingsWindow() {
    document.getElementById('settings-window').classList.add('hidden');
}


export function initUI() {
    document.addEventListener('click', (e) => {
        const startMenu = document.getElementById('start-menu');
        const startBtn = document.getElementById('start-btn');
        if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            hideStartMenu();
        }
    });

    document.getElementById('settings-menu-btn').addEventListener('click', async () => {
        hideStartMenu();
        await openSettingsWindow();
    });

    document.getElementById('adaptive-mode-toggle').addEventListener('change', async (e) => {
        const isChecked = e.target.checked;
        document.getElementById('manual-color-picker').classList.toggle('hidden', isChecked);
        const data = await getUnifiedData();
        data.myTime.adaptiveTheme = isChecked;
        await saveUnifiedData(data);
        await applyCurrentTheme();
    });

    document.getElementById('manual-color-picker').addEventListener('click', async (e) => {
        const target = e.target.closest('button[data-color]');
        if (target) {
            const color = target.dataset.color;
            await applyManualTheme(color);
        }
    });

    document.getElementById('wallpaper-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            event.target.value = null;
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showNotification('La imagen es demasiado grande (máx 10MB).', true);
            event.target.value = null;
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64String = e.target.result;
            const data = await getUnifiedData();
            data.myTime.wallpaper = base64String;
            await saveUnifiedData(data);
            
            await applyCurrentTheme();

            const currentWallpaperPreview = document.getElementById('current-wallpaper-preview');
            currentWallpaperPreview.innerHTML = `
                <div class="wallpaper-preview-item">
                    <img src="${base64String}" alt="Fondo de pantalla actual">
                </div>
            `;
            showNotification('Fondo de pantalla actualizado.');
        };

        reader.onerror = () => {
            showNotification('Error al leer el archivo de imagen.', true);
        };

        reader.readAsDataURL(file);
        event.target.value = null;
    });

    document.getElementById('change-wallpaper-btn').addEventListener('click', () => {
        document.getElementById('wallpaper-input').click();
    });

    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.settings-nav-btn.active').classList.remove('active', 'bg-black/10');
            btn.classList.add('active', 'bg-black/10');
            document.querySelectorAll('.settings-section').forEach(sec => sec.classList.add('hidden'));
            document.getElementById(`settings-section-${btn.dataset.section}`).classList.remove('hidden');
        });
    });

    document.addEventListener('click', (e) => {
        const settingsWindow = document.getElementById('settings-window');
        const settingsMenuBtn = document.getElementById('settings-menu-btn');
        if (!settingsWindow.classList.contains('hidden') && !settingsWindow.contains(e.target) && e.target !== settingsMenuBtn && !settingsMenuBtn.contains(e.target)) {
            closeSettingsWindow();
        }
    });
}
