// --- Módulo de Autenticación y Sesión ---
import {
    goToLoginStep,
    proceedToMainContent,
    showNotification
} from './ui.js';
import {
    checkForBackupAndProceed
} from './backup.js';

let tokenClient;
let googleUser = null;
let loginMethod = '';
let username = '';
let currentPin = '';
let savedPin = '';
let isConfirmingPin = false;
let isLoginMode = false;

const CLIENT_ID = '256041941450-u9nfv1gqu0tl0tl0hcn7omub6v17lfbk.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

// --- Inicialización de Google API y Lógica de Autenticación ---

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

export async function initializeGoogleApis() {
    const googleChoiceBtn = document.getElementById('google-login-choice-btn');
    const googleBtnText = googleChoiceBtn.querySelector('span');

    if (CLIENT_ID.startsWith('TU_CLIENT_ID')) {
        if (googleBtnText) googleBtnText.textContent = 'Falta Client ID';
        console.error("ERROR: Please replace the CLIENT_ID value in main.js with your own from Google Cloud Console.");
        return;
    }
    try {
        await loadScript('https://accounts.google.com/gsi/client');

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '',
        });

        await loadScript('https://apis.google.com/js/api.js');

        await new Promise((resolve, reject) => {
            gapi.load('client', {
                callback: resolve,
                onerror: reject
            });
        });
        await gapi.client.load("https://www.googleapis.com/discovery/v1/apis/drive/v3/rest");

        googleChoiceBtn.disabled = false;
        googleChoiceBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        if (googleBtnText) googleBtnText.textContent = 'En línea con Google';

    } catch (error) {
        console.error("Error initializing Google APIs:", error);
        if (googleBtnText) googleBtnText.textContent = 'Error de API';
        showNotification("Error al inicializar la API. Revisa la consola.", true);
    }
}

function handleAuthClick() {
    if (!tokenClient || !gapi.client) {
        showNotification("Las APIs de Google no están listas.", true);
        return;
    }
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Google token error:', resp);
            showNotification('Error de autenticación con Google.', true);
            throw (resp);
        }
        gapi.client.setToken(resp);
        try {
            const response = await gapi.client.request({
                'path': 'https://www.googleapis.com/oauth2/v3/userinfo'
            });
            googleUser = response.result;
            loginMethod = 'google';
            document.getElementById('username-input').value = googleUser.name;
            document.getElementById('profile-pic-preview').src = googleUser.picture;
            await checkForBackupAndProceed();
        } catch (error) {
            console.error("Error fetching user profile:", error);
            showNotification("Error al obtener perfil de Google.", true);
        }
    };
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({
            prompt: 'consent'
        });
    } else {
        tokenClient.requestAccessToken({
            prompt: ''
        });
    }
}

// --- Lógica de PIN ---
function updatePinDisplay() {
    const pinDisplayDots = document.querySelectorAll('.pin-display-dot');
    pinDisplayDots.forEach((dot, index) => {
        dot.classList.toggle('active-dot', index < currentPin.length);
        dot.classList.toggle('bg-white/50', index >= currentPin.length);
    });
}

function showPinError(message, title = "Error") {
    const pinDotsContainer = document.getElementById('pin-dots-container');
    const pinGreeting = document.getElementById('pin-greeting');
    const pinSubtitle = document.getElementById('pin-subtitle');

    pinDotsContainer.classList.add('shake');
    pinGreeting.textContent = title;
    pinSubtitle.textContent = message;
    setTimeout(() => {
        pinDotsContainer.classList.remove('shake');
        currentPin = '';
        updatePinDisplay();
        if (isLoginMode) {
            pinGreeting.textContent = `Hola, ${username}`;
            pinSubtitle.textContent = "Introduce tu PIN para continuar.";
        } else {
            pinGreeting.textContent = `Hola, ${username}`;
            pinSubtitle.textContent = "Crea un PIN de 4 dígitos.";
            isConfirmingPin = false;
            savedPin = '';
        }
    }, 1200);
}

// [MODIFICADO] La función ahora es asíncrona porque llama a 'proceedToMainContent'
async function handlePinEntry() {
    if (isLoginMode) {
        if (currentPin === savedPin) {
            await proceedToMainContent({
                isLogin: true,
                username: username,
                pfp: document.getElementById('profile-pic-preview').src
            });
        } else {
            showPinError("PIN incorrecto. Inténtalo de nuevo.");
        }
        return;
    }

    if (isConfirmingPin) {
        if (currentPin === savedPin) {
            // [MODIFICADO] Se espera a que la función asíncrona termine
            setTimeout(async () => await proceedToMainContent({
                isLogin: false,
                username: username,
                pin: savedPin,
                pfp: document.getElementById('profile-pic-preview').src,
                loginMethod: loginMethod,
                googleProfile: loginMethod === 'google' ? googleUser : null
            }), 300);
        } else {
            showPinError("Los PIN no coinciden.", "Error de confirmación");
        }
    } else {
        savedPin = currentPin;
        currentPin = '';
        isConfirmingPin = true;
        document.getElementById('pin-greeting').textContent = "Confirma tu PIN";
        document.getElementById('pin-subtitle').textContent = "Vuelve a introducir tu PIN.";
        setTimeout(updatePinDisplay, 250);
    }
}

function createKeypad() {
    const pinKeypad = document.getElementById('pin-keypad');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
    keys.forEach(key => {
        const keyEl = document.createElement('button');
        keyEl.type = 'button';
        keyEl.className = 'pin-keypad-btn w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold text-gray-700 bg-white/50 hover:bg-white/70 transition-colors active:scale-90';
        if (key === '') {
            keyEl.className += ' pointer-events-none bg-transparent';
        } else if (key === 'del') {
            keyEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" /></svg>`;
            keyEl.dataset.key = 'del';
        } else {
            keyEl.textContent = key;
            keyEl.dataset.key = key;
        }
        pinKeypad.appendChild(keyEl);
    });
}

// --- Flujo de Inicio de Sesión y Configuración ---
export function checkForSavedUser(unifiedData) {
    const savedUser = unifiedData.globalSettings.userProfile;
    const onboardingIsComplete = unifiedData.globalSettings.onboardingComplete;

    if (onboardingIsComplete && savedUser && savedUser.pin) {
        isLoginMode = true;
        username = savedUser.username;
        savedPin = savedUser.pin;
        document.getElementById('profile-pic-preview').src = savedUser.pfp;
        loginMethod = savedUser.loginMethod;
        if (loginMethod === 'google') {
            googleUser = savedUser.googleProfile;
        }
        document.getElementById('onboarding-screen').style.display = 'none';

        document.getElementById('login-screen').classList.remove('opacity-0', 'pointer-events-none');
        goToLoginStep('3');
        document.getElementById('pin-greeting').textContent = `Hola, ${username}`;
        document.getElementById('pin-subtitle').textContent = "Introduce tu PIN para continuar.";
    }
}


export function getAuthDetails() {
    return {
        loginMethod,
        googleUser
    };
}

export function forceGoogleReauth() {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            console.error("Google token client not initialized.");
            return reject(new Error("El cliente de Google no está listo."));
        }

        tokenClient.callback = (response) => {
            if (response && response.access_token) {
                gapi.client.setToken(response);
                resolve(response.access_token);
            } else {
                console.error("Google re-auth failed:", response);
                reject(new Error(response.error || 'No se pudo re-autenticar con Google.'));
            }
        };

        tokenClient.requestAccessToken({
            prompt: 'consent'
        });
    });
}

export function resetPinInput() {
    currentPin = '';
    updatePinDisplay();
}


export function initAuth() {
    // Inicializar Google APIs
    initializeGoogleApis();

    // Crear teclado numérico
    createKeypad();

    // --- Asignación de Eventos ---
    document.getElementById('google-login-choice-btn').addEventListener('click', handleAuthClick);
    document.getElementById('offline-login-choice-btn').addEventListener('click', () => {
        loginMethod = 'offline';
        goToLoginStep('2');
    });

    document.getElementById('profile-pic-input').addEventListener('change', (event) => {
        if (loginMethod === 'google') return;
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => document.getElementById('profile-pic-preview').src = e.target.result;
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('username-submit-btn').addEventListener('click', () => {
        const usernameInput = document.getElementById('username-input');
        if (usernameInput.value.trim() !== '') {
            username = usernameInput.value.trim();
            document.getElementById('pin-greeting').textContent = `Hola, ${username}`;
            goToLoginStep('3');
        } else {
            usernameInput.focus();
        }
    });

    document.getElementById('pin-keypad').addEventListener('click', (e) => {
        const key = e.target.closest('.pin-keypad-btn')?.dataset.key;
        const pinDotsContainer = document.getElementById('pin-dots-container');
        if (!key || pinDotsContainer.classList.contains('shake')) return;

        if (key === 'del') {
            currentPin = currentPin.slice(0, -1);
        } else if (currentPin.length < 4) {
            currentPin += key;
        }
        updatePinDisplay();

        if (currentPin.length === 4) {
            setTimeout(handlePinEntry, 250);
        }
    });
}
