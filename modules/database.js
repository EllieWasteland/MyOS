// --- Módulo de Base de Datos (Dexie.js) ---

/**
 * Carga un script de forma asíncrona desde una URL.
 * Evita volver a cargar el script si ya está presente en el DOM.
 * @param {string} src - La URL del script a cargar.
 * @returns {Promise<void>}
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

// Variable para mantener la instancia de la base de datos
let db = null;

/**
 * Inicializa y configura la base de datos Dexie.
 * Carga Dexie.js desde un CDN y define el esquema de la base de datos.
 * @returns {Promise<Dexie>} La instancia de la base de datos.
 */
async function initializeDB() {
    if (db) return db;

    try {
        // Carga Dexie.js desde un CDN
        await loadScript('https://unpkg.com/dexie@3/dist/dexie.js');

        // Crea una nueva instancia de la base de datos
        db = new Dexie('MySoulDB');

        // Define el esquema de la base de datos.
        // Se utiliza una tabla 'appData' para almacenar el objeto de estado completo.
        // 'key' es el identificador único (ej: 'mySoul-data-v1').
        // 'value' contiene el objeto de datos completo.
        db.version(1).stores({
            appData: 'key, value'
        });

        console.log("Database initialized successfully.");
        return db;
    } catch (error) {
        console.error("Failed to initialize database:", error);
        alert("No se pudo inicializar la base de datos. La aplicación no funcionará correctamente.");
        throw error;
    }
}

/**
 * Exporta una función que devuelve una promesa que se resuelve con la instancia de la BD.
 * Esto asegura que la base de datos se inicialice solo una vez (patrón singleton).
 */
export const getDB = (() => {
    let dbInstancePromise = null;
    return () => {
        if (!dbInstancePromise) {
            dbInstancePromise = initializeDB();
        }
        return dbInstancePromise;
    };
})();
