// Este archivo centraliza toda la lógica de almacenamiento.
import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/index.js';

const UNIFIED_STORAGE_KEY = 'mySoul-data-v1';

/**
 * Proporciona el estado inicial por defecto para toda la aplicación.
 * @returns {object} El objeto de estado por defecto.
 */
export function getDefaultUnifiedState() {
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
            filters: { priority: 'all', tag: 'all' },
            zenSettings: { pomodoro: 25, shortBreak: 5, longBreak: 15, color: '#00F0FF' },
            gamification: { streak: 0, lastCompletionDate: null, achievements: [], pomodoroCount: 0 },
            currentZenTaskId: null
        },
        myMemory: {
            memories: [],
            settings: { theme: 'dark' }
        },
        myRoute: {
            routes: [],
            settings: {
                mapStyle: 'dark'
            }
        },
        myMood: [],
        globalSettings: {
            onboardingComplete: false,
            externalApps: [],
            shortcuts: [],
            version: `v1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            lastModified: new Date().toISOString()
        }
    };
}

/**
 * Realiza una fusión profunda de dos objetos.
 * @param {object} target - El objeto de destino.
 * @param {object} source - El objeto fuente.
 * @returns {object} El objeto fusionado.
 */
function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (key === 'myMood' && Array.isArray(source[key])) {
                 output[key] = source[key];
            } else if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

/**
 * Comprueba si un item es un objeto.
 * @param {*} item - El item a comprobar.
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Obtiene los datos unificados desde IndexedDB.
 * Fusiona los datos guardados con el estado por defecto para asegurar que todas las propiedades existan.
 * @returns {Promise<object>} El estado completo de la aplicación.
 */
export async function getUnifiedData() {
    const data = await get(UNIFIED_STORAGE_KEY);
    const defaultState = getDefaultUnifiedState();
    if (data) {
        try {
            // idb-keyval ya devuelve el objeto parseado
            return deepMerge(defaultState, data);
        } catch (error) {
            console.error("Error al fusionar datos unificados, se retorna al estado por defecto:", error);
            return defaultState;
        }
    }
    return defaultState;
}

/**
 * Guarda el objeto de estado unificado en IndexedDB.
 * @param {object} data - El objeto de estado completo para guardar.
 */
export async function saveUnifiedData(data) {
    try {
        const dataToSave = { ...data };
        if (!dataToSave.globalSettings) {
            dataToSave.globalSettings = {};
        }
        // Cada vez que se guardan los datos, se genera una nueva versión y fecha.
        dataToSave.globalSettings.version = `v1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        dataToSave.globalSettings.lastModified = new Date().toISOString();
        
        // idb-keyval guarda el objeto directamente
        await set(UNIFIED_STORAGE_KEY, dataToSave);
    } catch (error) {
        console.error("Error al guardar los datos unificados:", error);
        window.showGlobalNotification?.('Error al guardar datos. El almacenamiento puede estar lleno.', true);
    }
}
