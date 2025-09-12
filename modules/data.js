// --- Módulo de Gestión de Datos ---

const UNIFIED_STORAGE_KEY = 'mySoul-data-v1';

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
            onboardingComplete: false,
            externalApps: [],
            shortcuts: [],
            userProfile: null,
            version: `v1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            lastModified: new Date().toISOString()
        }
    };
}

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

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function getUnifiedData() {
    const data = localStorage.getItem(UNIFIED_STORAGE_KEY);
    const defaultState = getDefaultUnifiedState();
    if (data) {
        try {
            return deepMerge(defaultState, JSON.parse(data));
        } catch (error) {
            console.error("Error parsing unified data, returning to default state:", error);
            return defaultState;
        }
    }
    return defaultState;
}

export function saveUnifiedData(data) {
    try {
        const dataToSave = { ...data
        };
        if (!dataToSave.globalSettings) {
            dataToSave.globalSettings = {};
        }
        dataToSave.globalSettings.version = `v1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        dataToSave.globalSettings.lastModified = new Date().toISOString();
        localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error("Error saving unified data:", error);
    }
}
