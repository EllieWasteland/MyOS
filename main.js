// --- Módulo Principal de Inicialización ---
import {
    getUnifiedData
} from './modules/data.js';
import {
    initOnboarding
} from './modules/onboarding.js';
import {
    initAuth,
    checkForSavedUser
} from './modules/auth.js';
import {
    initBackup
} from './modules/backup.js';
import {
    initUI,
    applyCurrentTheme,
    showNotification
} from './modules/ui.js';
import {
    initDesktop
} from './modules/desktop.js';
import {
    initApps
} from './modules/apps.js';
import {
    initTimer
} from './modules/timer.js';
import {
    initSearch
} from './modules/search.js';


document.addEventListener('DOMContentLoaded', () => {
    // Definir una función global para notificaciones para que los módulos
    // puedan usarla fácilmente si es necesario, aunque es mejor importar.
    window.showGlobalNotification = showNotification;

    // Obtener los datos iniciales
    const initialData = getUnifiedData();

    // Inicializar todos los módulos
    initOnboarding();
    initAuth();
    initBackup();
    initUI();
    initDesktop();
    initApps();
    initTimer();
    initSearch();

    // Comprobar si hay un usuario guardado para decidir si mostrar
    // el login o el onboarding.
    checkForSavedUser(initialData);

    // Aplicar el tema inicial si el usuario no ha iniciado sesión
    // (si inicia sesión, el tema se aplica en `proceedToMainContent`)
    if (!initialData.globalSettings.onboardingComplete) {
        applyCurrentTheme();
    }
});
