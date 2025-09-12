// --- Módulo de Aplicaciones Personalizadas ---
import {
    getUnifiedData,
    saveUnifiedData
} from './data.js';
import {
    showNotification,
    showConfirmationModal
} from './ui.js';
import {
    openApp
} from './desktop.js';

let appContextMenu = document.getElementById('app-context-menu');

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

export function renderCustomApps() {
    const data = getUnifiedData();
    const apps = data.globalSettings.externalApps || [];
    const customAppsGrid = document.getElementById('custom-apps-grid');
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
            <button class="delete-app-btn" title="Eliminar app">
                <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" /></svg>
            </button>`;

        appItem.querySelector('.custom-app-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            showAppContextMenu(e, app);
        });

        appItem.querySelector('.delete-app-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteApp(app.id);
        });

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

function showAppContextMenu(event, app) {
    appContextMenu.style.top = `${event.clientY}px`;
    appContextMenu.style.left = `${event.clientX}px`;
    appContextMenu.classList.remove('hidden');

    const newMenu = appContextMenu.cloneNode(true);
    appContextMenu.parentNode.replaceChild(newMenu, appContextMenu);
    appContextMenu = newMenu;

    appContextMenu.querySelector('[data-action="open-window"]').addEventListener('click', () => {
        const iconEl = document.createElement('div');
        iconEl.innerHTML = `<img src="${app.icon}" class="w-full h-full p-1">`;
        openApp(app.url, app.name, iconEl.innerHTML, null);
        hideAppContextMenu();
    });
    appContextMenu.querySelector('[data-action="open-tab"]').addEventListener('click', () => {
        window.open(app.url, '_blank');
        hideAppContextMenu();
    });
    appContextMenu.querySelector('[data-action="add-desktop"]').addEventListener('click', () => {
        addAppToDesktop(app);
        hideAppContextMenu();
    });
}

function hideAppContextMenu() {
    if (appContextMenu) {
        appContextMenu.classList.add('hidden');
    }
}

function deleteApp(appId) {
    showConfirmationModal(
        'Confirmar eliminación',
        '¿Estás seguro de que quieres eliminar esta aplicación?',
        () => {
            const data = getUnifiedData();
            data.globalSettings.externalApps = data.globalSettings.externalApps.filter(app => app.id !== appId);
            data.globalSettings.shortcuts = data.globalSettings.shortcuts.filter(shortcut => shortcut.id !== appId);
            saveUnifiedData(data);
            renderCustomApps();
            renderDesktopShortcuts();
            showNotification('Aplicación eliminada.');
        }
    );
}

function showAddAppModal() {
    const genericModal = document.getElementById('generic-modal');
    document.getElementById('generic-modal-title').textContent = 'Añadir Nueva Aplicación';
    document.getElementById('generic-modal-text').innerHTML = `
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
    document.getElementById('generic-modal-buttons').innerHTML = `
        <div class="flex gap-4">
            <button id="modal-save-app" class="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition">Guardar</button>
            <button id="modal-cancel-add" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition">Cancelar</button>
        </div>`;
    genericModal.style.display = 'flex';

    document.getElementById('modal-cancel-add').addEventListener('click', () => {
        genericModal.style.display = 'none';
    }, {
        once: true
    });

    document.getElementById('modal-save-app').addEventListener('click', async () => {
        const nameInput = document.getElementById('app-name-input');
        const urlInput = document.getElementById('app-url-input');
        const name = nameInput.value.trim();
        let url = urlInput.value.trim();

        if (!name || !url) {
            showNotification('Por favor, completa ambos campos.', true);
            return;
        }
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        try {
            new URL(url);
        } catch (_) {
            showNotification('La URL no es válida.', true);
            return;
        }

        showNotification('Creando aplicación...');
        genericModal.style.display = 'none';

        const icon = await getFaviconAsBase64(url);
        const newApp = {
            id: `app-${Date.now()}`,
            name: name,
            url: url,
            icon: icon
        };

        const data = getUnifiedData();
        if (!data.globalSettings.externalApps) data.globalSettings.externalApps = [];
        data.globalSettings.externalApps.push(newApp);
        saveUnifiedData(data);
        renderCustomApps();
        showNotification(`'${name}' ha sido añadida.`);

    }, {
        once: true
    });
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

    const iconEl = document.createElement('button');
    iconEl.className = "w-20 h-24 flex flex-col items-center justify-start gap-1 text-white hover:bg-white/10 rounded-lg p-2 transition-colors";
    iconEl.innerHTML = `
        <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
            <img src="${shortcut.icon}" alt="${shortcut.name}" class="w-full h-full object-contain">
        </div>
        <span class="text-xs font-medium text-center w-full truncate" style="text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">${shortcut.name}</span>`;

    iconEl.addEventListener('click', () => {
        window.open(shortcut.url, '_blank');
    });

    iconContainer.appendChild(iconEl);
    return iconContainer;
}

export function renderDesktopShortcuts() {
    const desktop = document.getElementById('desktop');
    desktop.querySelectorAll('.desktop-shortcut').forEach(el => el.remove());
    const data = getUnifiedData();
    const shortcuts = data.globalSettings.shortcuts || [];

    const iconWidthWithGap = 80 + 16;
    const iconHeightWithGap = 96 + 16;
    const desktopPaddingTop = 80;
    const desktopPaddingX = 16;

    const availableHeight = desktop.clientHeight - desktopPaddingTop - 16;
    const iconsPerColumn = Math.floor(availableHeight / iconHeightWithGap);

    if (iconsPerColumn <= 0) return;

    shortcuts.forEach((shortcut, index) => {
        const iconEl = createDesktopIcon(shortcut);
        const col = Math.floor(index / iconsPerColumn);
        const row = index % iconsPerColumn;
        const top = desktopPaddingTop + (row * iconHeightWithGap);
        const left = desktopPaddingX + (col * iconWidthWithGap);
        iconEl.style.top = `${top}px`;
        iconEl.style.left = `${left}px`;
        desktop.appendChild(iconEl);
    });
}

export function initApps() {
    // Evento global para cerrar el menú contextual
    document.addEventListener('click', (e) => {
        if (appContextMenu && !appContextMenu.classList.contains('hidden') && !appContextMenu.contains(e.target) && !e.target.closest('.custom-app-item')) {
            hideAppContextMenu();
        }
    });
}
