// --- Módulo de Gestión de Datos ---
import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/index.js';

const UNIFIED_STORAGE_KEY = 'mySoul-data-v1';

// Devuelve el estado inicial por defecto de la aplicación.
function getDefaultUnifiedState() {
    return {
        myTime: {
            userName: null,
            tasks: [],
            schedule: [],
            projects: [],
            shopping: [],
            currentView: 'dashboard',
            selectedTaskId: null,
            selectedSubjectId: null,
            tempSubtasks: [],
            calendarDate: new Date().toISOString(),
            wallpaper: null,
            adaptiveTheme: true,
            manualThemeColor: 'pink',
            filters: {
                priority: 'all',
                tag: 'all'
            },
            zenSettings: {
                pomodoro: 25,
                shortBreak: 5,
                longBreak: 15,
                color: '#00F0FF'
            },
            gamification: {
                streak: 0,
                lastCompletionDate: null,
                achievements: [],
                pomodoroCount: 0
            },
            currentZenTaskId: null
        },
        myMemory: {
            memories: [],
            settings: {
                theme: 'dark'
            }
        },
        myRoute: {
            routes: [],
            settings: {
                mapStyle: 'dark'
            }
        },
        myMood: [],
        globalSettings: {
            GemApi: null,
            onboardingComplete: false,
            externalApps: [],
            shortcuts: [],
            userProfile: null,
            version: `v1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            lastModified: new Date().toISOString()
        }
    };
}

// Combina recursivamente el estado guardado con el estado por defecto para evitar errores.
function deepMerge(target, source) {
    const output = { ...target
    };
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

// Comprueba si un item es un objeto.
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Obtiene los datos unificados desde IndexedDB.
 * Es una función asíncrona.
 * @returns {Promise<Object>} El objeto de datos de la aplicación.
 */
export async function getUnifiedData() {
    const data = await get(UNIFIED_STORAGE_KEY);
    const defaultState = getDefaultUnifiedState();
    if (data) {
        try {
            // idb-keyval devuelve el objeto directamente, no es necesario JSON.parse
            return deepMerge(defaultState, data);
        } catch (error) {
            console.error("Error merging unified data, returning to default state:", error);
            return defaultState;
        }
    }
    return defaultState;
}

/**
 * Guarda el objeto de datos unificados en IndexedDB.
 * Es una función asíncrona.
 * @param {Object} data - El objeto de datos completo de la aplicación.
 */
export async function saveUnifiedData(data) {
    try {
        const dataToSave = { ...data
        };
        if (!dataToSave.globalSettings) {
            dataToSave.globalSettings = {};
        }
        // Actualiza la versión y la fecha de modificación antes de guardar.
        dataToSave.globalSettings.version = `v1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        dataToSave.globalSettings.lastModified = new Date().toISOString();
        
        // idb-keyval guarda el objeto directamente, no es necesario JSON.stringify
        await set(UNIFIED_STORAGE_KEY, dataToSave);
    } catch (error) {
        console.error("Error saving unified data:", error);
        // Notifica al usuario si el guardado falla (por ejemplo, por falta de espacio).
        window.showGlobalNotification?.('Error al guardar datos. El almacenamiento puede estar lleno.', true);
    }
}
