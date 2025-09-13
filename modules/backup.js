// --- Módulo de Copias de Seguridad (Backup) ---
import {
    showNotification,
    showModalAlert,
    showConflictModal
} from './ui.js';
import {
    getUnifiedData,
    saveUnifiedData
} from './data.js';
import {
    getAuthDetails,
    forceGoogleReauth // [MODIFICADO] Importar la nueva función de re-autenticación
} from './auth.js';
import {
    proceedToMainContent
} from './ui.js';

// --- Funciones de Google Drive ---

async function findOrCreateAppFolder() {
    const response = await gapi.client.drive.files.list({
        q: "name='WebAppDrive' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name)'
    });
    if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id;
    } else {
        const fileMetadata = {
            'name': 'WebAppDrive',
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const createResponse = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        return createResponse.result.id;
    }
}

async function uploadFileToFolder(folderId, fileName, fileBlob, overwrite = false) {
    let fileId = null;
    if (overwrite) {
        const files = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
            fields: 'files(id)'
        });
        if (files.result.files && files.result.files.length > 0) {
            fileId = files.result.files[0].id;
        }
    }

    const metadata = {
        'name': fileName,
        mimeType: 'application/json'
    };
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
                'path': path,
                'method': method,
                'params': {
                    'uploadType': 'multipart'
                },
                'headers': {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            });

            request.execute((response) => {
                if (response && !response.error) {
                    resolve(response);
                } else {
                    reject(response || new Error('Error de subida desconocido'));
                }
            });
        };
        reader.readAsText(fileBlob, 'UTF-8');
        reader.onerror = error => reject(error);
    });
}


// --- Lógica de Restauración y Sincronización ---

async function applyRestoredData(data) {
    await saveUnifiedData(data);

    const savedUser = data.globalSettings?.userProfile;
    if (data.globalSettings?.onboardingComplete && savedUser?.pin) {
        showNotification("Datos restaurados exitosamente.", false);
        return true;
    } else {
        showNotification("La copia de seguridad es inválida o está incompleta.", true);
        return false;
    }
}

export async function checkForBackupAndProceed() {
    const {
        goToLoginStep
    } = await import('./ui.js');
    goToLoginStep('backup');
    document.getElementById('backup-checker').classList.remove('hidden');
    document.getElementById('backup-restorer').classList.add('hidden');

    try {
        const folderId = await findOrCreateAppFolder();
        const files = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and name='mySoul-data.json' and trashed=false`,
            fields: 'files(id, name, version)'
        });

        if (files.result.files && files.result.files.length > 0) {
            const fileId = files.result.files[0].id;
            document.getElementById('backup-checker').classList.add('hidden');
            document.getElementById('backup-restorer').classList.remove('hidden');

            document.getElementById('restore-backup-btn').addEventListener('click', async () => {
                showNotification("Restaurando datos...");
                try {
                    const response = await gapi.client.drive.files.get({
                        fileId: fileId,
                        alt: 'media'
                    });
                    const cloudData = JSON.parse(response.body);

                    if (await applyRestoredData(cloudData)) {
                        showNotification("Restauración completa. ¡Bienvenido de vuelta!", false);
                        const savedUser = cloudData.globalSettings.userProfile;
                        setTimeout(() => proceedToMainContent({
                            isLogin: true,
                            username: savedUser.username,
                            pfp: savedUser.pfp,
                            pin: savedUser.pin
                        }), 500);
                    } else {
                        goToLoginStep('2');
                    }
                } catch (restoreError) {
                    console.error("Error restoring data:", restoreError);
                    showNotification("Error al procesar la copia de seguridad.", true);
                    goToLoginStep('2');
                }
            }, {
                once: true
            });

            document.getElementById('skip-restore-btn').addEventListener('click', () => {
                goToLoginStep('2');
            }, {
                once: true
            });

        } else {
            setTimeout(() => goToLoginStep('2'), 1000);
        }
    } catch (error) {
        console.error("Error checking for backup:", error);
        showNotification("No se pudo verificar la copia de seguridad.", true);
        setTimeout(() => goToLoginStep('2'), 1000);
    }
}

async function saveDataToDrive() {
    const {
        loginMethod
    } = getAuthDetails();
    if (loginMethod !== 'google') {
        showNotification("Debes iniciar sesión con Google para guardar.", true);
        return;
    }

    const executeSave = async () => {
        showNotification("Guardando en la nube...");
        const folderId = await findOrCreateAppFolder();
        const dataToSync = await getUnifiedData();
        const fileContent = JSON.stringify(dataToSync, null, 2);
        const blob = new Blob([fileContent], {
            type: 'application/json'
        });
        await uploadFileToFolder(folderId, 'mySoul-data.json', blob, true);
        showNotification("¡Guardado en la nube completado!");
    };

    try {
        if (!gapi.client.getToken()) {
            throw {
                result: {
                    error: {
                        code: 401
                    }
                }
            };
        }
        await executeSave();
    } catch (err) {
        if (err?.result?.error?.code === 401) {
            try {
                showNotification("Sesión expirada. Renueva el permiso...", false);
                await forceGoogleReauth();
                showNotification("Sesión renovada. Reintentando...", false);
                await executeSave();
            } catch (retryErr) {
                console.error("Re-authentication or retry failed:", retryErr);
                showModalAlert("No se pudo renovar tu sesión con Google o la operación falló de nuevo. Por favor, inténtalo más tarde.", "Error de Sesión");
            }
        } else {
            console.error("Error saving to Drive:", err);
            showNotification("Error al guardar en Drive.", true);
        }
    }
}

async function loadDataFromDrive() {
    const {
        loginMethod
    } = getAuthDetails();
    if (loginMethod !== 'google') {
        showNotification("Debes iniciar sesión con Google para cargar.", true);
        return;
    }

    const executeLoad = async () => {
        showNotification("Buscando datos en la nube...");
        const folderId = await findOrCreateAppFolder();
        const filesResponse = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and name='mySoul-data.json' and trashed=false`,
            fields: 'files(id, name, version)'
        });

        if (!filesResponse.result.files || filesResponse.result.files.length === 0) {
            showModalAlert("No se encontraron datos en la nube para esta cuenta.", "Sin Datos");
            return;
        }

        const fileId = filesResponse.result.files[0].id;
        const dataResponse = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        const cloudData = JSON.parse(dataResponse.body);
        const localData = await getUnifiedData();
        const differences = findDifferences(localData, cloudData);

        if (!differences.hasDifferences) {
            showModalAlert("Tus datos locales ya están sincronizados con la nube.", "Sincronizado");
            return;
        }

        showConflictModal(localData, cloudData, differences, async (dataToRestore) => {
            if (await applyRestoredData(dataToRestore)) {
                const savedUser = dataToRestore.globalSettings.userProfile;
                await proceedToMainContent({
                    isLogin: true,
                    username: savedUser.username,
                    pfp: savedUser.pfp,
                    pin: savedUser.pin
                });
            }
        });
    };

    try {
        if (!gapi.client.getToken()) {
            throw {
                result: {
                    error: {
                        code: 401
                    }
                }
            };
        }
        await executeLoad();
    } catch (err) {
        if (err?.result?.error?.code === 401) {
            try {
                showNotification("Sesión expirada. Renueva el permiso...", false);
                await forceGoogleReauth();
                showNotification("Sesión renovada. Reintentando...", false);
                await executeLoad();
            } catch (retryErr) {
                console.error("Re-authentication or retry failed:", retryErr);
                showModalAlert("No se pudo renovar tu sesión con Google o la operación falló de nuevo. Por favor, inténtalo más tarde.", "Error de Sesión");
            }
        } else {
            console.error("Error loading from Drive:", err);
            showNotification("Error al cargar datos de Drive.", true);
        }
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

async function exportLocalData() {
    try {
        const data = await getUnifiedData();
        const dataString = JSON.stringify(data, null, 2);
        const blob = new Blob(["\uFEFF" + dataString], {
            type: 'application/json;charset=utf-8'
        });
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
        reader.onload = async (readerEvent) => {
            try {
                const content = readerEvent.target.result;
                const importedData = JSON.parse(content);

                if (importedData && importedData.globalSettings && importedData.myTime) {
                    const {
                        showConfirmationModal
                    } = await import('./ui.js');
                    showConfirmationModal(
                        'Confirmar Importación',
                        'Los datos importados reemplazarán tus datos actuales. ¿Estás seguro de que quieres continuar?',
                        async () => {
                            if (await applyRestoredData(importedData)) {
                                const savedUser = importedData.globalSettings.userProfile;
                                await proceedToMainContent({
                                    isLogin: true,
                                    username: savedUser.username,
                                    pfp: savedUser.pfp,
                                    pin: savedUser.pin
                                });
                            }
                        }
                    );

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


export function initBackup() {
    document.getElementById('save-cloud-btn').addEventListener('click', saveDataToDrive);
    document.getElementById('load-cloud-btn').addEventListener('click', loadDataFromDrive);
    document.getElementById('export-local-btn').addEventListener('click', exportLocalData);
    document.getElementById('import-local-btn').addEventListener('click', importLocalData);
}
