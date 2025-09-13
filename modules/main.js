// --- Módulo Principal de Inicialización ---
// [MODIFICADO] Rutas de importación ajustadas a una estructura plana
import {
    getUnifiedData
} from './data.js';
import {
    initOnboarding
} from './onboarding.js';
import {
    initAuth,
    checkForSavedUser
} from './auth.js';
import {
    initBackup
} from './backup.js';
import {
    initUI,
    applyCurrentTheme,
    showNotification
} from './ui.js';
import {
    initDesktop
} from './desktop.js';
import {
    initApps
} from './apps.js';
import {
    initTimer
} from './timer.js';
import {
    initSearch
} from './search.js';

/**
 * [NUEVO]
 * Función de utilidad para cargar scripts dinámicamente.
 * Se usará para cargar la librería idb-keyval.
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script ${src}`));
        document.head.appendChild(script);
    });
}


document.addEventListener('DOMContentLoaded', async () => { // [MODIFICADO] Callback ahora asíncrono
    try {
        // [NUEVO] Cargar la librería idb-keyval desde un CDN antes de que la app la necesite.
        await loadScript('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js');

        // Definir una función global para notificaciones
        window.showGlobalNotification = showNotification;

        // [MODIFICADO] Obtener los datos iniciales de forma asíncrona
        const initialData = await getUnifiedData();

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
        if (!initialData.globalSettings.onboardingComplete) {
            applyCurrentTheme();
        }
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        document.body.innerHTML = `<div style="text-align: center; color: red; padding: 40px;">
            <h1>Error de Inicialización</h1>
            <p>No se pudo cargar la aplicación. Por favor, revisa la consola para más detalles.</p>
        </div>`;
    }
});
