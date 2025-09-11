// --- Google API Configuration ---
// IMPORTANTE: Reemplaza el valor de CLIENT_ID con tu propia credencial de Google Cloud Console.
// La API_KEY ha sido eliminada por seguridad, ya que no es necesaria para este flujo de autenticación.
const CLIENT_ID = '256041941450-u9nfv1gqu0tl0tl0hcn7omub6v17lfbk.apps.googleusercontent.com'; // DEBES REEMPLAZAR ESTE VALOR
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

let tokenClient;
let googleUser = null; 

// --- Data Manager Logic ---
const UNIFIED_STORAGE_KEY = 'mySoul-data-v1';

function getDefaultUnifiedState() {
    return {
        myTime: { userName: null, tasks: [], schedule: [], projects: [], shopping: [], currentView: 'dashboard', selectedTaskId: null, selectedSubjectId: null, tempSubtasks: [], calendarDate: new Date().toISOString(), wallpaper: null, adaptiveTheme: true, manualThemeColor: 'pink', filters: { priority: 'all', tag: 'all' }, zenSettings: { pomodoro: 25, shortBreak: 5, longBreak: 15, color: '#00F0FF' }, gamification: { streak: 0, lastCompletionDate: null, achievements: [], pomodoroCount: 0 }, currentZenTaskId: null },
        myMemory: { memories: [], settings: { theme: 'dark' } },
        myRoute: { routes: [], settings: { mapStyle: 'dark' } },
        myMood: [],
        globalSettings: { onboardingComplete: false, externalApps: [], shortcuts: [], userProfile: null, version: `v1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, lastModified: new Date().toISOString() }
    };
}

function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (key === 'myMood' && Array.isArray(source[key])) {
                output[key] = source[key];
            } else if (isObject(source[key])) {
                if (key in target && isObject(target[key])) {
                    output[key] = deepMerge(target[key], source[key]);
                } else {
                    output[key] = source[key];
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
}

function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }

function getUnifiedData() {
    const data = localStorage.getItem(UNIFIED_STORAGE_KEY);
    const defaultState = getDefaultUnifiedState();
    if (data) {
        try { return deepMerge(defaultState, JSON.parse(data)); } 
        catch (error) { console.error("Error parsing unified data, returning to default state:", error); return defaultState; }
    }
    return defaultState;
}

function saveUnifiedData(data) {
    try {
        const dataToSave = { ...data };
        if (!dataToSave.globalSettings) { dataToSave.globalSettings = {}; }
        dataToSave.globalSettings.version = `v1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        dataToSave.globalSettings.lastModified = new Date().toISOString();
        localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) { console.error("Error saving unified data:", error); }
}

// --- Dynamic Script Loading ---
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src; script.async = true; script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

async function initializeGoogleApis() {
    const googleChoiceBtn = document.getElementById('google-login-choice-btn');
    const googleBtnText = googleChoiceBtn.querySelector('span');

    if (CLIENT_ID.startsWith('TU_CLIENT_ID')) {
        if(googleBtnText) googleBtnText.textContent = 'Falta Client ID';
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
        await gapi.client.load(DISCOVERY_DOCS[0]);
        
        googleChoiceBtn.disabled = false;
        googleChoiceBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        if(googleBtnText) googleBtnText.textContent = 'En línea con Google';

    } catch (error) {
        console.error("Error initializing Google APIs:", error);
        if(googleBtnText) googleBtnText.textContent = 'Error de API';
        if(window.showGlobalNotification) { window.showGlobalNotification("Error al inicializar la API. Revisa la consola.", true); }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // --- Element Declarations ---
    const body = document.body;
    const googleChoiceBtn = document.getElementById('google-login-choice-btn');
    const animatedBg = document.getElementById('animated-bg');
    const onboardingScreen = document.getElementById('onboarding-screen');
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('main-content');
    const finishOnboardingBtn = document.getElementById('finish-onboarding-btn');
    const loginStep1 = document.getElementById('login-step-1');
    const loginStepBackup = document.getElementById('login-step-backup');
    const backupChecker = document.getElementById('backup-checker');
    const backupRestorer = document.getElementById('backup-restorer');
    const restoreBackupBtn = document.getElementById('restore-backup-btn');
    const skipRestoreBtn = document.getElementById('skip-restore-btn');
    const loginStep2 = document.getElementById('login-step-2');
    const loginStep3 = document.getElementById('login-step-3');
    const offlineChoiceBtn = document.getElementById('offline-login-choice-btn');
    const profilePicInput = document.getElementById('profile-pic-input');
    const profilePicPreview = document.getElementById('profile-pic-preview');
    const startMenuAvatar = document.getElementById('start-menu-avatar');
    const usernameInput = document.getElementById('username-input');
    const usernameSubmitBtn = document.getElementById('username-submit-btn');
    const pinGreeting = document.getElementById('pin-greeting');
    const pinSubtitle = document.getElementById('pin-subtitle');
    const pinDotsContainer = document.getElementById('pin-dots-container');
    const pinDisplayDots = pinDotsContainer.querySelectorAll('.pin-display-dot');
    const pinKeypad = document.getElementById('pin-keypad');
    const saveCloudBtn = document.getElementById('save-cloud-btn');
    const loadCloudBtn = document.getElementById('load-cloud-btn');
    const exportLocalBtn = document.getElementById('export-local-btn');
    const importLocalBtn = document.getElementById('import-local-btn');
    const notification = document.getElementById('notification');
    const genericModal = document.getElementById('generic-modal');
    const modalTitle = document.getElementById('generic-modal-title');
    const modalText = document.getElementById('generic-modal-text');
    const modalButtons = document.getElementById('generic-modal-buttons');
    const clockBtn = document.getElementById('clock-btn');
    const timerPopup = document.getElementById('timer-popup');
    const timerPresetBtns = document.querySelectorAll('.timer-preset-btn');
    const timerWidgetContainer = document.getElementById('timer-widget-container');
    const timerWidget = document.getElementById('timer-widget');
    const timerWidgetDisplay = document.getElementById('timer-widget-display');
    const timerWidgetControls = document.getElementById('timer-widget-controls');
    const timerPauseResumeBtn = document.getElementById('timer-pause-resume-btn');
    const timerStopBtn = document.getElementById('timer-stop-btn');
    const changeWallpaperBtn = document.getElementById('change-wallpaper-btn');
    const wallpaperInput = document.getElementById('wallpaper-input');
    const taskbar = document.getElementById('taskbar');
    const customAppsGrid = document.getElementById('custom-apps-grid');
    const desktop = document.getElementById('desktop');
    const settingsMenuBtn = document.getElementById('settings-menu-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const settingsWindow = document.getElementById('settings-window');

    // --- Initial State Setup ---
    googleChoiceBtn.disabled = true;
    googleChoiceBtn.classList.add('opacity-50', 'cursor-not-allowed');

    // --- State Variables ---
    let loginMethod = '';
    let username = '';
    let currentPin = '';
    let savedPin = '';
    let isConfirmingPin = false;
    let isLoginMode = false;
    let timerInterval = null;
    let timerEndTime = 0;
    let timerPausedTime = 0;
    let isTimerPaused = false;
    let totalTimerDuration = 0;

    // --- Theme Generation Logic ---
    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
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

        // Clear manual theme classes
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
            } catch(e) {
                console.error("Error generating theme from wallpaper:", e);
            }
        };
        img.onerror = () => console.error("Could not load image for color theming.");
        img.src = imageUrl;
    }
    
    function applyManualTheme(colorName) {
        const styleSheet = document.getElementById('dynamic-theme-styles');
        styleSheet.innerHTML = ''; // Clear adaptive styles
        
        body.className = body.className.replace(/theme-\S+/g, ' ');
        body.classList.add(`theme-${colorName}`);
        
        const data = getUnifiedData();
        data.myTime.manualThemeColor = colorName;
        saveUnifiedData(data);
    }
    
    function applyCurrentTheme() {
        const data = getUnifiedData();
        applyWallpaperUI(data.myTime.wallpaper);
        
        if (data.myTime.adaptiveTheme) {
            updateAdaptiveTheme(data.myTime.wallpaper);
        } else {
            applyManualTheme(data.myTime.manualThemeColor || 'pink');
        }
    }


    // --- UI Utility Functions ---
    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.classList.add('notification-visible');

        setTimeout(() => {
            notification.classList.remove('notification-visible');
        }, 3000);
    }
    window.showGlobalNotification = showNotification;

    function showModalAlert(message, title = 'Notificación') {
        modalTitle.textContent = title;
        modalText.innerHTML = `<p class="text-gray-600 my-4">${message}</p>`;
        modalButtons.innerHTML = `<button id="modal-ok-btn" class="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">Aceptar</button>`;
        genericModal.style.display = 'flex';
        document.getElementById('modal-ok-btn').addEventListener('click', () => { genericModal.style.display = 'none'; }, { once: true });
    }
    
    // --- Data Restore Logic ---
    function applyRestoredData(data) {
        saveUnifiedData(data); 

        const savedUser = data.globalSettings?.userProfile;
        if (data.globalSettings?.onboardingComplete && savedUser?.pin) {
            username = savedUser.username;
            savedPin = savedUser.pin;
            loginMethod = savedUser.loginMethod;
            googleUser = savedUser.googleProfile;
            isLoginMode = true; 

            profilePicPreview.src = savedUser.pfp;
            const hour = new Date().getHours();
            greetingElement.innerHTML = `${hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'},<br>${username}`;
            startBtn.style.backgroundImage = `url(${savedUser.pfp})`;
            startMenuAvatar.src = savedUser.pfp;
            
            applyCurrentTheme();
            renderCustomApps(); 
            renderDesktopShortcuts();

            if (!appWindow.classList.contains('hidden')) {
                closeApp();
            }
            
            showNotification("Datos restaurados exitosamente.", false);
        } else {
            showNotification("La copia de seguridad es inválida o está incompleta.", true);
        }
    }


    // --- Google Auth & Drive Logic ---
    async function checkForBackupAndProceed() {
        goToLoginStep('backup');
        backupChecker.classList.remove('hidden');
        backupRestorer.classList.add('hidden');

        try {
            const folderId = await findOrCreateAppFolder();
            const files = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and name='mySoul-data.json' and trashed=false`,
                fields: 'files(files(id, name, version))'
            });

            if (files.result.files && files.result.files.length > 0) {
                const fileId = files.result.files[0].id;
                backupChecker.classList.add('hidden');
                backupRestorer.classList.remove('hidden');

                restoreBackupBtn.addEventListener('click', async () => {
                    showNotification("Restaurando datos...");
                    try {
                        const response = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
                        const cloudData = JSON.parse(response.body);
                        applyRestoredData(cloudData); 
                        
                        const savedUser = cloudData.globalSettings?.userProfile;
                        if (cloudData.globalSettings?.onboardingComplete && savedUser?.pin) {
                            showNotification("Restauración completa. ¡Bienvenido de vuelta!", false);
                            setTimeout(proceedToMainContent, 500);
                        } else {
                            showNotification("La copia de seguridad está incompleta. Por favor, configura un nuevo perfil.", true);
                            goToLoginStep('2');
                        }
                    } catch (restoreError) {
                        console.error("Error restoring data:", restoreError);
                        showNotification("Error al procesar la copia de seguridad.", true);
                        goToLoginStep('2');
                    }
                }, { once: true });

                skipRestoreBtn.addEventListener('click', () => {
                    goToLoginStep('2');
                }, { once: true });

            } else {
                setTimeout(() => goToLoginStep('2'), 1000);
            }
        } catch (error) {
            console.error("Error checking for backup:", error);
            showNotification("No se pudo verificar la copia de seguridad.", true);
            setTimeout(() => goToLoginStep('2'), 1000);
        }
    }

    function handleAuthClick() {
        if (!tokenClient || !gapi.client) { showNotification("Las APIs de Google no están listas.", true); return; }
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error('Google token error:', resp);
                showNotification('Error de autenticación con Google.', true);
                throw (resp);
            }
            gapi.client.setToken(resp);
            try {
                const response = await gapi.client.request({ 'path': 'https://www.googleapis.com/oauth2/v3/userinfo' });
                googleUser = response.result;
                loginMethod = 'google';
                usernameInput.value = googleUser.name;
                profilePicPreview.src = googleUser.picture;
                await checkForBackupAndProceed();
            } catch (error) {
                console.error("Error fetching user profile:", error);
                showNotification("Error al obtener perfil de Google.", true);
            }
        };
        if (gapi.client.getToken() === null) { tokenClient.requestAccessToken({ prompt: 'consent' }); } 
        else { tokenClient.requestAccessToken({ prompt: '' }); }
    }

    async function saveDataToDrive() {
        if (loginMethod !== 'google' || !googleUser) { showNotification("Debes iniciar sesión con Google para guardar.", true); return; }
        if (!gapi.client.getToken()) { showNotification("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.", true); handleAuthClick(); return; }
        showNotification("Guardando en la nube...");
        try {
            const folderId = await findOrCreateAppFolder();
            const dataToSync = getUnifiedData();
            const fileContent = JSON.stringify(dataToSync, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });
            await uploadFileToFolder(folderId, 'mySoul-data.json', blob, true);
            showNotification("¡Guardado en la nube completado!");
        } catch (error) { console.error("Error saving to Drive:", error); showNotification("Error al guardar en Drive.", true); }
    }
    
    async function loadDataFromDrive() {
        if (loginMethod !== 'google' || !googleUser) { showNotification("Debes iniciar sesión con Google para cargar.", true); return; }
        if (!gapi.client.getToken()) { showNotification("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.", true); handleAuthClick(); return; }
        showNotification("Buscando datos en la nube...");

        try {
            const folderId = await findOrCreateAppFolder();
            const files = await gapi.client.drive.files.list({ q: `'${folderId}' in parents and name='mySoul-data.json' and trashed=false`, fields: 'files(id, name, version)' });

            if (!files.result.files || files.result.files.length === 0) {
                showModalAlert("No se encontraron datos en la nube para esta cuenta.", "Sin Datos");
                return;
            }

            const fileId = files.result.files[0].id;
            const response = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
            const cloudData = JSON.parse(response.body);
            
            const localData = getUnifiedData();
            const differences = findDifferences(localData, cloudData);

            if (!differences.hasDifferences) {
                showModalAlert("Tus datos locales ya están sincronizados con la nube.", "Sincronizado");
                return;
            }

            showConflictModal(localData, cloudData, differences);

        } catch (error) {
            console.error("Error loading data from Drive:", error);
            showNotification("Error al cargar datos de Drive.", true);
        }
    }

    function findDifferences(localData, cloudData) {
        const localTimestamp = new Date(localData.globalSettings?.lastModified || 0);
        const cloudTimestamp = new Date(cloudData.globalSettings?.lastModified || 0);
        const hasDifferences = localData.globalSettings?.version !== cloudData.globalSettings?.version;

        return {
            hasDifferences: hasDifferences,
            cloudIsNewer: cloudTimestamp > localTimestamp,
            localVersion: localData.globalSettings?.version || 'N/A',
            cloudVersion: cloudData.globalSettings?.version || 'N/A'
        };
    }

    function showConflictModal(localData, cloudData, differences) {
        const recommendation = differences.cloudIsNewer 
            ? '<p class="text-sm text-green-600 mt-2">Recomendación: La copia en la nube es más reciente.</p>' 
            : '<p class="text-sm text-yellow-600 mt-2">Atención: Tus datos locales parecen ser más recientes.</p>';

        const summaryHTML = `
            <p class="text-gray-600 my-4">Se encontraron diferencias entre tus datos locales y la copia en la nube.</p>
            <div class="text-left text-sm bg-black/10 p-3 rounded-lg border border-pink-200">
                <p class="font-semibold mb-2">Versión Nube: <span class="font-mono text-xs">${differences.cloudVersion}</span></p>
                <p class="font-semibold">Versión Local: <span class="font-mono text-xs">${differences.localVersion}</span></p>
            </div>
            ${recommendation}
            <p class="text-gray-600 my-4">¿Qué deseas hacer?</p>`;

        modalTitle.textContent = 'Conflicto de Sincronización';
        modalText.innerHTML = summaryHTML;
        modalButtons.innerHTML = `
            <div class="flex flex-col gap-3 w-full">
                <button id="modal-restore-cloud" class="w-full px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">Restaurar desde la Nube</button>
                <button id="modal-keep-local" class="w-full px-6 py-2 bg-white/80 text-gray-800 rounded-full hover:bg-white transition">Mantener mis Datos Locales</button>
                <button id="modal-cancel-sync" class="w-full px-6 py-2 text-gray-600 hover:bg-black/10 rounded-full transition">Cancelar</button>
            </div>`;
        genericModal.style.display = 'flex';

        const close = () => { genericModal.style.display = 'none'; };
        
        document.getElementById('modal-restore-cloud').addEventListener('click', () => {
            close();
            applyRestoredData(cloudData);
        }, { once: true });

        document.getElementById('modal-keep-local').addEventListener('click', close, { once: true });
        document.getElementById('modal-cancel-sync').addEventListener('click', close, { once: true });
    }

    async function findOrCreateAppFolder() {
        const response = await gapi.client.drive.files.list({ q: "name='WebAppDrive' and mimeType='application/vnd.google-apps.folder' and trashed=false", fields: 'files(id, name)' });
        if (response.result.files && response.result.files.length > 0) { return response.result.files[0].id; } 
        else {
            const fileMetadata = { 'name': 'WebAppDrive', 'mimeType': 'application/vnd.google-apps.folder' };
            const createResponse = await gapi.client.drive.files.create({ resource: fileMetadata, fields: 'id' });
            return createResponse.result.id;
        }
    }
    
    async function uploadFileToFolder(folderId, fileName, fileBlob, overwrite = false) {
        let fileId = null;
        if (overwrite) {
            const files = await gapi.client.drive.files.list({ q: `'${folderId}' in parents and name='${fileName}' and trashed=false`, fields: 'files(id)' });
            if (files.result.files && files.result.files.length > 0) {
                fileId = files.result.files[0].id;
            }
        }
    
        const metadata = { 'name': fileName, mimeType: 'application/json' };
        if (!fileId) {
            metadata.parents = [folderId];
        }
    
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = () => {
                const boundary = '-------314159265358979323846';
                const delimiter = "\r\n--" + boundary + "\r\n";
                const close_delim = "\r\n--" + boundary + "--";
                const fileData = reader.result;
    
                const multipartRequestBody =
                    delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) +
                    delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + fileData + close_delim;
    
                const path = fileId ? `/upload/drive/v3/files/${fileId}` : '/upload/drive/v3/files';
                const method = fileId ? 'PATCH' : 'POST';
    
                const request = gapi.client.request({
                    'path': path, 'method': method, 'params': { 'uploadType': 'multipart' },
                    'headers': { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                    'body': multipartRequestBody
                });
    
                request.execute((file) => {
                    if (file && !file.error) { resolve(file); } 
                    else { reject(file.error || new Error('Unknown upload error')); }
                });
            };
            reader.readAsText(fileBlob, 'UTF-8');
            reader.onerror = error => reject(error);
        });
    }

    // --- Local Backup Logic ---
    function exportLocalData() {
        try {
            const data = getUnifiedData();
            const dataString = JSON.stringify(data, null, 2);
            const blob = new Blob(["\uFEFF" + dataString], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            a.download = `mySoul-backup-${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showNotification('Copia de seguridad local exportada.');
        } catch (error) {
            console.error('Error exporting local data:', error);
            showNotification('Error al exportar la copia de seguridad.', true);
        }
    }

    function importLocalData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = readerEvent => {
                try {
                    const content = readerEvent.target.result;
                    const importedData = JSON.parse(content);

                    if (importedData && importedData.globalSettings && importedData.myTime) {
                         modalTitle.textContent = 'Confirmar Importación';
                         modalText.innerHTML = '<p class="text-gray-600 my-4">Los datos importados reemplazarán tus datos actuales. ¿Estás seguro de que quieres continuar?</p>';
                         modalButtons.innerHTML = `
                            <div class="flex gap-4">
                                <button id="modal-confirm-import" class="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition">Sí, Importar</button>
                                <button id="modal-cancel-import" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition">Cancelar</button>
                            </div>`;
                        genericModal.style.display = 'flex';
                        
                        document.getElementById('modal-confirm-import').addEventListener('click', () => {
                            applyRestoredData(importedData);
                            hideStartMenu();
                            genericModal.style.display = 'none';
                        }, { once: true });

                        document.getElementById('modal-cancel-import').addEventListener('click', () => {
                            genericModal.style.display = 'none';
                        }, { once: true });

                    } else {
                        showNotification('El archivo de copia de seguridad no es válido.', true);
                    }
                } catch (error) {
                    console.error('Error importing local data:', error);
                    showNotification('Error al leer o procesar el archivo.', true);
                }
            };
            reader.readAsText(file, 'UTF-8');
        };
        input.click();
    }

    // --- Core Functions ---
    function applyWallpaperUI(base64String) {
        const defaultWallpaper = 'https://c10.patreonusercontent.com/4/patreon-media/p/post/115987106/014a2a344eb04af0bd534066629930b5/eyJiIjo3MCwidyI6MTA4MH0%3D/1.gif?token-hash=FQipZ-GoI8DzRBu_sXt6i_LBQ2HyXOnQoWoL9BBK-aU%3D';
        const imageUrl = base64String || defaultWallpaper;
        animatedBg.style.backgroundImage = `url(${imageUrl})`;
    }

    function goToLoginStep(step) {
        const steps = {
            '1': loginStep1,
            'backup': loginStepBackup,
            '2': loginStep2,
            '3': loginStep3
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

        if (step === '2') {
            usernameInput.focus();
        }
    }

    function proceedToMainContent() {
        const unifiedData = getUnifiedData();
        if (!isLoginMode) {
            unifiedData.globalSettings.onboardingComplete = true;
            unifiedData.globalSettings.userProfile = { username: username, pin: savedPin, pfp: profilePicPreview.src, loginMethod: loginMethod, googleProfile: loginMethod === 'google' ? googleUser : null };
            saveUnifiedData(unifiedData);
        }

        applyCurrentTheme();
        renderCustomApps();
        renderDesktopShortcuts();

        animatedBg.classList.remove('zoomed-in');
        loginScreen.style.opacity = '0';
        mainContent.classList.remove('opacity-0', 'pointer-events-none');
        greetingElement.innerHTML = `Hola,<br>${username}`;
        document.getElementById('start-btn').style.backgroundImage = `url(${profilePicPreview.src})`;
        startMenuAvatar.src = profilePicPreview.src;
        loginScreen.addEventListener('transitionend', () => loginScreen.style.display = 'none', { once: true });
    }
    
    function handleLogout() {
        hideStartMenu();
        closeApp();
        stopTimer();
        
        mainContent.classList.add('opacity-0', 'pointer-events-none');
        
        loginScreen.style.display = 'flex';
        setTimeout(() => {
            loginScreen.style.opacity = '1';
            loginScreen.classList.remove('pointer-events-none');
        }, 100);
        
        animatedBg.classList.add('zoomed-in');
        
        goToLoginStep('3');
        pinGreeting.textContent = `Hola, ${username}`;
        pinSubtitle.textContent = "Introduce tu PIN para continuar.";
        currentPin = '';
        updatePinDisplay();
    }

    function checkForSavedUser() {
        const unifiedData = getUnifiedData();
        const savedUser = unifiedData.globalSettings.userProfile;
        const onboardingIsComplete = unifiedData.globalSettings.onboardingComplete;

        if (onboardingIsComplete && savedUser && savedUser.pin) {
            isLoginMode = true;
            username = savedUser.username;
            savedPin = savedUser.pin;
            profilePicPreview.src = savedUser.pfp;
            loginMethod = savedUser.loginMethod;
            if (loginMethod === 'google') { googleUser = savedUser.googleProfile; }
            onboardingScreen.style.display = 'none';
            
            loginScreen.classList.remove('opacity-0', 'pointer-events-none');
            goToLoginStep('3');
            pinGreeting.textContent = `Hola, ${username}`;
            pinSubtitle.textContent = "Introduce tu PIN para continuar.";
        } else {
             applyCurrentTheme(); // Apply default theme on first load
        }
    }

    // --- Onboarding & Setup Logic ---
    const onboardingNextBtns = document.querySelectorAll('.onboarding-next-btn');
    onboardingNextBtns.forEach(btn => btn.addEventListener('click', () => {
        const currentStep = btn.closest('.onboarding-step');
        const nextStep = document.getElementById(`onboarding-step-${btn.dataset.nextStep}`);
        if (currentStep && nextStep) {
            currentStep.style.opacity = '0'; currentStep.style.pointerEvents = 'none';
            nextStep.style.opacity = '1'; nextStep.style.pointerEvents = 'auto';
        }
    }));

    finishOnboardingBtn.addEventListener('click', () => {
        onboardingScreen.style.opacity = '0';
        loginScreen.classList.remove('opacity-0', 'pointer-events-none');
        goToLoginStep('1');
        onboardingScreen.addEventListener('transitionend', () => onboardingScreen.style.display = 'none', { once: true });
    });

    googleChoiceBtn.addEventListener('click', handleAuthClick);
    offlineChoiceBtn.addEventListener('click', () => { loginMethod = 'offline'; goToLoginStep('2'); });
    
    profilePicInput.addEventListener('change', (event) => {
        if(loginMethod === 'google') return;
        const file = event.target.files[0];
        if (file) { const reader = new FileReader(); reader.onload = (e) => profilePicPreview.src = e.target.result; reader.readAsDataURL(file); }
    });

    usernameSubmitBtn.addEventListener('click', () => {
        if (usernameInput.value.trim() !== '') {
            username = usernameInput.value.trim();
            pinGreeting.textContent = `Hola, ${username}`;
            goToLoginStep('3');
        } else { usernameInput.focus(); }
    });
    
    // --- PIN Keypad Logic ---
    function updatePinDisplay() { pinDisplayDots.forEach((dot, index) => { dot.classList.toggle('active-dot', index < currentPin.length); dot.classList.toggle('bg-white/50', index >= currentPin.length); }); }
    
    function showPinError(message, title = "Error") {
        pinDotsContainer.classList.add('shake');
        pinGreeting.textContent = title; pinSubtitle.textContent = message;
        setTimeout(() => {
            pinDotsContainer.classList.remove('shake'); currentPin = ''; updatePinDisplay();
            if (isLoginMode) { pinGreeting.textContent = `Hola, ${username}`; pinSubtitle.textContent = "Introduce tu PIN para continuar."; } 
            else { pinGreeting.textContent = `Hola, ${username}`; pinSubtitle.textContent = "Crea un PIN de 4 dígitos."; isConfirmingPin = false; savedPin = ''; }
        }, 1200);
    }

    function handlePinEntry() {
        if (isLoginMode) { if (currentPin === savedPin) { proceedToMainContent(); } else { showPinError("PIN incorrecto. Inténtalo de nuevo."); } return; }
        if (isConfirmingPin) { if (currentPin === savedPin) { setTimeout(proceedToMainContent, 300); } else { showPinError("Los PIN no coinciden.", "Error de confirmación"); } } 
        else { savedPin = currentPin; currentPin = ''; isConfirmingPin = true; pinGreeting.textContent = "Confirma tu PIN"; pinSubtitle.textContent = "Vuelve a introducir tu PIN."; setTimeout(updatePinDisplay, 250); }
    }

    function createKeypad() {
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
        keys.forEach(key => {
            const keyEl = document.createElement('button');
            keyEl.type = 'button';
            keyEl.className = 'pin-keypad-btn w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold text-gray-700 bg-white/50 hover:bg-white/70 transition-colors active:scale-90';
            if (key === '') { keyEl.className += ' pointer-events-none bg-transparent'; } 
            else if (key === 'del') { keyEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" /></svg>`; keyEl.dataset.key = 'del'; } 
            else { keyEl.textContent = key; keyEl.dataset.key = key; }
            pinKeypad.appendChild(keyEl);
        });
    }

    pinKeypad.addEventListener('click', (e) => {
        const key = e.target.closest('.pin-keypad-btn')?.dataset.key;
        if (!key || pinDotsContainer.classList.contains('shake')) return;
        if (key === 'del') { currentPin = currentPin.slice(0, -1); } 
        else if (currentPin.length < 4) { currentPin += key; }
        updatePinDisplay();
        if (currentPin.length === 4) { setTimeout(handlePinEntry, 250); }
    });
    
    // --- Initialization ---
    initializeGoogleApis();
    createKeypad();
    checkForSavedUser();

    // --- Web OS Logic (Desktop) ---
    const appIcons = document.querySelectorAll('.app-icon');
    const appWindow = document.getElementById('app-window');
    const windowTitle = document.getElementById('window-title');
    const windowIcon = document.getElementById('window-icon');
    const appContentFrame = document.getElementById('app-content-frame');
    const loader = document.getElementById('loader');
    const closeWindowBtn = document.getElementById('close-window-btn');
    const maximizeWindowBtn = document.getElementById('maximize-window-btn');
    const clockElement = document.getElementById('clock');
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');
    const greetingElement = document.getElementById('greeting');
    let activeIcon = null; let isAnimating = false;
    const maxIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;
    const restoreIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
    maximizeWindowBtn.innerHTML = maxIconSVG;

    function updateClock() { const now = new Date(); clockElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); }
    updateClock(); setInterval(updateClock, 1000);
    
    const loadAppContent = (url) => { appContentFrame.src = url; appContentFrame.onload = () => { loader.classList.add('hidden'); appContentFrame.classList.remove('hidden'); }; };
    
    const closeApp = (callback) => {
        if (!activeIcon && appWindow.classList.contains('hidden') || isAnimating) { if (typeof callback === 'function') callback(); return; }
        isAnimating = true; 
        
        let startRect = { top: 0, left: 0, width: 0, height: 0 };
        if (activeIcon) {
            const iconRect = activeIcon.getBoundingClientRect();
            startRect = { top: iconRect.top, left: iconRect.left, width: iconRect.width, height: iconRect.height };
        } else {
             const { top, left, width, height } = appWindow.getBoundingClientRect();
             startRect = { top, left, width, height };
        }

        appWindow.classList.add('window-animating');
        if (appWindow.classList.contains('is-maximized')) { appWindow.classList.remove('is-maximized'); document.body.classList.remove('window-maximized'); maximizeWindowBtn.innerHTML = maxIconSVG; }
        appWindow.style.transition = 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)';
        appWindow.style.top = `${startRect.top}px`; appWindow.style.left = `${startRect.left}px`; appWindow.style.width = `${startRect.width}px`; appWindow.style.height = `${startRect.height}px`;
        appWindow.style.borderRadius = '9999px'; appWindow.style.opacity = '0';
        setTimeout(() => {
            appWindow.classList.add('hidden'); appWindow.classList.remove('window-animating'); appWindow.style.cssText = ''; appWindow.classList.add('top-4', 'left-4', 'right-4', 'bottom-20');
            windowTitle.textContent = ''; windowIcon.innerHTML = ''; activeIcon = null; isAnimating = false;
            if (typeof callback === 'function') { callback(); }
        }, 350);
    };
    
    const openApp = (url, title, iconHtml, clickedIcon) => {
        if (isAnimating) return;
        hideStartMenu();
        closeDrawer();
        if (activeIcon && activeIcon !== clickedIcon) { closeApp(() => openApp(url, title, iconHtml, clickedIcon)); return; }
        if (activeIcon === clickedIcon) return;
        isAnimating = true; activeIcon = clickedIcon;
        
        const hasSourceIcon = clickedIcon && clickedIcon.getBoundingClientRect;
        const iconRect = hasSourceIcon ? activeIcon.getBoundingClientRect() : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };
        
        appWindow.style.transition = 'none';
        appWindow.style.top = `${iconRect.top}px`; appWindow.style.left = `${iconRect.left}px`; appWindow.style.width = `${iconRect.width}px`; appWindow.style.height = `${iconRect.height}px`;
        appWindow.style.borderRadius = hasSourceIcon ? '9999px' : '1rem';
        appWindow.style.opacity = '0';
        appWindow.classList.remove('hidden', 'top-4', 'left-4', 'right-4', 'bottom-20');
        appWindow.classList.add('window-animating');
        windowTitle.textContent = title; windowIcon.innerHTML = iconHtml;
        loader.classList.remove('hidden'); appContentFrame.classList.add('hidden'); appContentFrame.src = 'about:blank';
        
        requestAnimationFrame(() => {
            appWindow.style.transition = 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)';
            const finalTop = 16, finalLeft = 16, finalWidth = window.innerWidth - 32, finalHeight = window.innerHeight - (16 + 80);
            appWindow.style.top = `${finalTop}px`; appWindow.style.left = `${finalLeft}px`; appWindow.style.width = `${finalWidth}px`; appWindow.style.height = `${finalHeight}px`;
            appWindow.style.borderRadius = ''; appWindow.style.opacity = '1';
            setTimeout(() => { appWindow.classList.remove('window-animating'); appWindow.style.cssText = ''; appWindow.classList.add('top-4', 'left-4', 'right-4', 'bottom-20'); loadAppContent(url); isAnimating = false; }, 350);
        });
    };
    
    function showStartMenu() {
        if (startMenu.classList.contains('visible')) return;
        closeDrawer();
        const hour = new Date().getHours();
        greetingElement.innerHTML = `${hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'},<br>${username}`;
        startMenu.classList.remove('hidden');
        setTimeout(() => startMenu.classList.add('visible'), 10);
    }
    function hideStartMenu() {
        if (!startMenu.classList.contains('visible')) return;
        startMenu.classList.remove('visible');
        startMenu.addEventListener('transitionend', () => startMenu.classList.add('hidden'), { once: true });
    }

    // --- Timer Logic ---
    function updateTimerDisplay() {
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
        timerWidgetContainer.classList.remove('hidden');
        clockBtn.disabled = true;
        updateTimerDisplay();
        timerInterval = setInterval(updateTimerDisplay, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerWidgetContainer.classList.add('hidden');
        timerWidgetControls.classList.add('hidden');
        clockBtn.disabled = false;
        isTimerPaused = false;
        timerPauseResumeBtn.textContent = 'Pausar';
    }

    function toggleTimerPause() {
        isTimerPaused = !isTimerPaused;
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
    
    // --- App Drawer & Custom Apps Logic ---
    function openDrawer() {
        if (taskbar.classList.contains('drawer-open')) return;
        hideStartMenu();
        taskbar.classList.add('drawer-open');
    }

    function closeDrawer() {
        if (!taskbar.classList.contains('drawer-open')) return;
        taskbar.classList.remove('drawer-open');
    }

    async function getFaviconAsBase64(url) {
        try {
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
            const response = await fetch(faviconUrl);
            if (!response.ok) throw new Error('Favicon not found');
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Could not fetch favicon:", error);
            const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
            return `data:image/svg+xml;base64,${btoa(defaultSvg)}`;
        }
    }

    function renderCustomApps() {
        const data = getUnifiedData();
        const apps = data.globalSettings.externalApps || [];
        
        const customAppsContainer = customAppsGrid.querySelector('.custom-app-item')?.parentElement || customAppsGrid;
        customAppsContainer.innerHTML = '';
        
        apps.forEach(app => {
            const appItem = document.createElement('div');
            appItem.className = 'custom-app-item';
            appItem.innerHTML = `
                <div class="custom-app-icon">
                    <img src="${app.icon}" alt="${app.name} icon">
                    <span>${app.name}</span>
                </div>
                <div class="app-actions">
                    <button class="app-action-btn" data-action="open-window" title="Abrir en ventana">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" /></svg>
                    </button>
                    <button class="app-action-btn" data-action="open-tab" title="Abrir en nueva pestaña">
                         <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 0V6.75A2.25 2.25 0 0011.25 4.5h-7.5" /></svg>
                    </button>
                    <button class="app-action-btn" data-action="add-desktop" title="Añadir al escritorio">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>
                    </button>
                </div>
                <button class="delete-app-btn" title="Eliminar app">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" /></svg>
                </button>`;
            
            appItem.querySelector("[data-action='open-window']").addEventListener('click', () => {
                const iconEl = document.createElement('div');
                iconEl.innerHTML = `<img src="${app.icon}" class="w-full h-full p-1">`;
                openApp(app.url, app.name, iconEl.innerHTML, null); // Pass null for clickedIcon
            });
            appItem.querySelector("[data-action='open-tab']").addEventListener('click', () => window.open(app.url, '_blank'));
            appItem.querySelector("[data-action='add-desktop']").addEventListener('click', () => addAppToDesktop(app));
            appItem.querySelector('.delete-app-btn').addEventListener('click', () => deleteApp(app.id));

            customAppsContainer.appendChild(appItem);
        });

        const addButtonPlaceholder = document.createElement('div');
        addButtonPlaceholder.className = 'custom-app-item';
        addButtonPlaceholder.innerHTML = `<button id="add-new-app-btn" class="w-full h-full flex flex-col items-center justify-center bg-black/5 hover:bg-black/10 rounded-2xl text-gray-600 transition p-2 aspect-square">
                                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        <span class="text-xs font-medium mt-1 text-center">Añadir App</span>
                                    </button>`;
        customAppsContainer.appendChild(addButtonPlaceholder);
        document.getElementById('add-new-app-btn').addEventListener('click', showAddAppModal);
    }
    
    function deleteApp(appId) {
        modalTitle.textContent = 'Confirmar eliminación';
        modalText.innerHTML = `<p class="text-gray-600 my-4">¿Estás seguro de que quieres eliminar esta aplicación?</p>`;
        modalButtons.innerHTML = `
            <div class="flex gap-4">
                <button id="modal-confirm-delete" class="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition">Sí, Eliminar</button>
                <button id="modal-cancel-delete" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition">Cancelar</button>
            </div>`;
        genericModal.style.display = 'flex';

        document.getElementById('modal-confirm-delete').addEventListener('click', () => {
            const data = getUnifiedData();
            data.globalSettings.externalApps = data.globalSettings.externalApps.filter(app => app.id !== appId);
            saveUnifiedData(data);
            renderCustomApps();
            genericModal.style.display = 'none';
            showNotification('Aplicación eliminada.');
        }, { once: true });

        document.getElementById('modal-cancel-delete').addEventListener('click', () => {
            genericModal.style.display = 'none';
        }, { once: true });
    }

    function showAddAppModal() {
        modalTitle.textContent = 'Añadir Nueva Aplicación';
        modalText.innerHTML = `
            <form id="add-app-form" class="flex flex-col gap-4 text-left">
                <div>
                    <label for="app-name-input" class="block text-sm font-medium text-gray-700">Nombre de la App</label>
                    <input type="text" id="app-name-input" class="mt-1 w-full bg-white/70 border border-pink-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700" required>
                </div>
                <div>
                    <label for="app-url-input" class="block text-sm font-medium text-gray-700">URL del Sitio Web</label>
                    <input type="url" id="app-url-input" placeholder="https://ejemplo.com" class="mt-1 w-full bg-white/70 border border-pink-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700" required>
                </div>
            </form>`;
        modalButtons.innerHTML = `
            <div class="flex gap-4">
                <button id="modal-save-app" class="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">Guardar</button>
                <button id="modal-cancel-add" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition">Cancelar</button>
            </div>`;
        genericModal.style.display = 'flex';

        document.getElementById('modal-cancel-add').addEventListener('click', () => {
            genericModal.style.display = 'none';
        }, { once: true });
        
        document.getElementById('modal-save-app').addEventListener('click', async () => {
            const nameInput = document.getElementById('app-name-input');
            const urlInput = document.getElementById('app-url-input');
            const name = nameInput.value.trim();
            let url = urlInput.value.trim();

            if (!name || !url) { showNotification('Por favor, completa ambos campos.', true); return; }
            if (!url.startsWith('http')) { url = 'https://' + url; }
            try { new URL(url); } catch (_) { showNotification('La URL no es válida.', true); return; }
            
            showNotification('Creando aplicación...');
            genericModal.style.display = 'none';
            
            const icon = await getFaviconAsBase64(url);
            const newApp = { id: `app-${Date.now()}`, name: name, url: url, icon: icon };

            const data = getUnifiedData();
            if (!data.globalSettings.externalApps) data.globalSettings.externalApps = [];
            data.globalSettings.externalApps.push(newApp);
            saveUnifiedData(data);
            renderCustomApps();
            showNotification(`'${name}' ha sido añadida.`);

        }, { once: true });
    }

    function addAppToDesktop(app) {
        const data = getUnifiedData();
        const isAlreadyOnDesktop = data.globalSettings.shortcuts.some(s => s.id === app.id);
        if (isAlreadyOnDesktop) {
            showNotification(`'${app.name}' ya está en el escritorio.`);
            return;
        }
        data.globalSettings.shortcuts.push(app);
        saveUnifiedData(data);
        renderDesktopShortcuts();
        showNotification(`'${app.name}' añadido al escritorio.`);
    }
    
    function createDesktopIcon(shortcut) {
        const iconContainer = document.createElement('div');
        iconContainer.className = 'desktop-shortcut absolute';
        iconContainer.style.top = `${Math.random() * 50 + 5}%`; // Random position for now
        iconContainer.style.left = `${Math.random() * 80 + 10}%`;

        const iconEl = document.createElement('button');
        iconEl.className = "w-20 h-24 flex flex-col items-center justify-start gap-1 text-white hover:bg-white/10 rounded-lg p-2 transition-colors";
        iconEl.innerHTML = `
            <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
                <img src="${shortcut.icon}" alt="${shortcut.name}" class="w-full h-full object-contain">
            </div>
            <span class="text-xs font-medium text-center w-full truncate" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">${shortcut.name}</span>`;
        
        iconEl.addEventListener('click', () => {
            const tempIcon = document.createElement('div');
            tempIcon.innerHTML = `<img src="${shortcut.icon}" class="w-full h-full p-1">`;
            openApp(shortcut.url, shortcut.name, tempIcon.innerHTML, iconEl);
        });
        
        iconContainer.appendChild(iconEl);
        desktop.appendChild(iconContainer);
        return iconContainer;
    }
    
    function renderDesktopShortcuts() {
        desktop.querySelectorAll('.desktop-shortcut').forEach(el => el.remove());
        const data = getUnifiedData();
        const shortcuts = data.globalSettings.shortcuts || [];
        shortcuts.forEach(createDesktopIcon);
    }

    // --- Settings Window Logic ---
    function openSettingsWindow() {
        const data = getUnifiedData();
        const userProfile = data.globalSettings.userProfile;

        // Populate Account Info
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

        // Populate Personalization
        const adaptiveToggle = document.getElementById('adaptive-mode-toggle');
        adaptiveToggle.checked = data.myTime.adaptiveTheme;
        document.getElementById('manual-color-picker').classList.toggle('hidden', adaptiveToggle.checked);
        
        // Populate current wallpaper preview
        const currentWallpaperPreview = document.getElementById('current-wallpaper-preview');
        const defaultWallpaper = 'https://c10.patreonusercontent.com/4/patreon-media/p/post/115987106/014a2a344eb04af0bd534066629930b5/eyJiIjo3MCwidyI6MTA4MH0%3D/1.gif?token-hash=FQipZ-GoI8DzRBu_sXt6i_LBQ2HyXOnQoWoL9BBK-aU%3D';
        const currentWallpaperSrc = data.myTime.wallpaper || defaultWallpaper;
        currentWallpaperPreview.innerHTML = `
            <div class="wallpaper-preview-item">
                <img src="${currentWallpaperSrc}" alt="Fondo de pantalla actual">
            </div>
        `;
        
        settingsWindow.classList.remove('hidden');
    }

    function closeSettingsWindow() {
        settingsWindow.classList.add('hidden');
    }

    // --- Event Listeners ---
    startBtn.addEventListener('click', (e) => { e.stopPropagation(); showStartMenu(); });
    logoutBtn.addEventListener('click', handleLogout);
    settingsMenuBtn.addEventListener('click', () => { hideStartMenu(); openSettingsWindow(); });

    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            hideStartMenu();
        }
        if (!timerPopup.contains(e.target) && !clockBtn.contains(e.target)) {
            timerPopup.classList.add('hidden');
        }
        if (timerWidgetContainer && !timerWidgetContainer.contains(e.target)) {
            timerWidgetControls.classList.add('hidden');
        }
        if (taskbar.classList.contains('drawer-open') && !taskbar.contains(e.target)) {
            closeDrawer();
        }
        if (!settingsWindow.classList.contains('hidden') && !settingsWindow.contains(e.target) && e.target !== settingsMenuBtn && !settingsMenuBtn.contains(e.target)) {
            closeSettingsWindow();
        }
    });

    saveCloudBtn.addEventListener('click', saveDataToDrive);
    loadCloudBtn.addEventListener('click', loadDataFromDrive);
    exportLocalBtn.addEventListener('click', exportLocalData);
    importLocalBtn.addEventListener('click', importLocalData);
    appIcons.forEach(icon => { 
        icon.addEventListener('click', () => { 
            openApp(icon.dataset.url, icon.dataset.title, icon.innerHTML, icon); 
        });
    });
    closeWindowBtn.addEventListener('click', () => closeApp());
    maximizeWindowBtn.addEventListener('click', () => {
        const isMaximized = appWindow.classList.toggle('is-maximized');
        document.body.classList.toggle('window-maximized', isMaximized);
        maximizeWindowBtn.innerHTML = isMaximized ? restoreIconSVG : maxIconSVG;
    });

    changeWallpaperBtn.addEventListener('click', () => wallpaperInput.click());
    wallpaperInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64String = e.target.result;
            const data = getUnifiedData();
            data.myTime.wallpaper = base64String;
            saveUnifiedData(data);
            applyCurrentTheme();
            showNotification('Fondo de pantalla actualizado.');
            hideStartMenu();
        };
        reader.onerror = () => { showNotification('Error al leer la imagen.', true); };
        reader.readAsDataURL(file);
        wallpaperInput.value = null;
    });

    // Timer Event Listeners
    clockBtn.addEventListener('click', (e) => { e.stopPropagation(); timerPopup.classList.toggle('hidden'); });
    timerPresetBtns.forEach(button => { button.addEventListener('click', () => { startTimer(parseInt(button.dataset.time, 10)); timerPopup.classList.add('hidden'); }); });
    timerWidgetContainer.addEventListener('click', (e) => { e.stopPropagation(); timerWidgetControls.classList.toggle('hidden'); });
    timerPauseResumeBtn.addEventListener('click', toggleTimerPause);
    timerStopBtn.addEventListener('click', stopTimer);

    // App Drawer Event Listeners
    taskbar.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) openDrawer();
        else closeDrawer();
    }, { passive: false });

    let touchStartY = 0;
    taskbar.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    taskbar.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchStartY - touchEndY > 50) openDrawer(); // Swipe up
        else if (touchEndY - touchStartY > 50) closeDrawer(); // Swipe down
    }, { passive: true });
    
    // Settings Window Event Listeners
    settingsWindow.querySelectorAll('.settings-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            settingsWindow.querySelector('.settings-nav-btn.active').classList.remove('active', 'bg-black/10');
            btn.classList.add('active', 'bg-black/10');
            settingsWindow.querySelectorAll('.settings-section').forEach(sec => sec.classList.add('hidden'));
            document.getElementById(`settings-section-${btn.dataset.section}`).classList.remove('hidden');
        });
    });

    document.getElementById('adaptive-mode-toggle').addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.getElementById('manual-color-picker').classList.toggle('hidden', isChecked);
        const data = getUnifiedData();
        data.myTime.adaptiveTheme = isChecked;
        saveUnifiedData(data);
        applyCurrentTheme();
    });
    
    document.getElementById('manual-color-picker').addEventListener('click', (e) => {
        const target = e.target.closest('button[data-color]');
        if(target) {
            const color = target.dataset.color;
            applyManualTheme(color);
        }
    });

    document.getElementById('wallpaper-selection-grid').addEventListener('click', (e) => {
        const button = e.target.closest('button.wallpaper-option');
        if (!button) return;

        const imgSrc = button.querySelector('img').src;
        
        const data = getUnifiedData();
        // For production, it's better to convert external URLs to base64 before saving
        // to avoid dependency on external links. For now, we save the URL directly.
        data.myTime.wallpaper = imgSrc;
        saveUnifiedData(data);
        applyCurrentTheme();
        openSettingsWindow(); // Re-open to refresh the preview
        showNotification('Fondo de pantalla actualizado.');
    });

});