// --- Módulo de Búsqueda de Google y Gemini ---

import { getUnifiedData, saveUnifiedData } from './data.js';
import { showInputModal, showNotification } from './ui.js';

/**
 * A simple markdown to HTML converter.
 * @param {string} md - The markdown string.
 * @returns {string} - The HTML string.
 */
function markdownToHtml(md) {
    let html = md
        .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic

    // Process lines
    const lines = html.split('\n');
    let inList = false;
    html = lines.map(line => {
        if (line.match(/^\s*(\*|-)\s/)) { // List items
            const li = `<li>${line.replace(/^\s*(\*|-)\s/, '')}</li>`;
            if (!inList) {
                inList = true;
                return `<ul>${li}`;
            }
            return li;
        } else {
            if (inList) {
                inList = false;
                return `</ul><p>${line}</p>`;
            }
            return `<p>${line}</p>`;
        }
    }).join('');

    if (inList) {
        html += '</ul>';
    }

    // Cleanup empty paragraphs
    return html.replace(/<p><\/p>/g, '');
}


/**
 * Calls the Gemini API and displays the response.
 * @param {string} apiKey - The user's Gemini API key.
 * @param {string} query - The question for the model.
 */
async function askGemini(apiKey, query) {
    const geminiResponseContainer = document.getElementById('gemini-response-container');
    const geminiResponseText = document.getElementById('gemini-response-text');
    const geminiLoader = document.getElementById('gemini-loader');
    const geminiActions = document.getElementById('gemini-actions');
    const googleSearchForm = document.getElementById('google-search-form');

    geminiResponseText.innerHTML = '';
    geminiActions.classList.add('hidden');
    geminiLoader.classList.remove('hidden');
    geminiResponseContainer.classList.remove('hidden');
    googleSearchForm.classList.add('gemini-active');

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: query
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            const text = data.candidates[0].content.parts[0].text;
            geminiResponseText.innerHTML = markdownToHtml(text);
            geminiActions.classList.remove('hidden');
        } else {
            throw new Error("No se recibió una respuesta válida de la API.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        geminiResponseText.innerHTML = `<p class="text-red-500 font-semibold">Error: ${error.message}</p>`;
        geminiActions.classList.add('hidden');
    } finally {
        geminiLoader.classList.add('hidden');
    }
}


export function initSearch() {
    const googleSearchForm = document.getElementById('google-search-form');
    const googleSearchInput = document.getElementById('google-search-input');
    const geminiSearchButton = document.getElementById('gemini-search-button');
    const geminiResponseContainer = document.getElementById('gemini-response-container');
    const geminiCopyBtn = document.getElementById('gemini-copy-btn');


    // Google Search logic
    if (googleSearchForm) {
        googleSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = googleSearchInput.value.trim();
            if (query) {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                window.open(searchUrl, '_blank');
            }
        });
    }

    // Gemini Search logic
    if (geminiSearchButton) {
        geminiSearchButton.addEventListener('click', async () => {
            const query = googleSearchInput.value.trim();
            if (!query) {
                showNotification('Por favor, escribe una pregunta para Gemini.', true);
                return;
            }

            let data = await getUnifiedData();
            let apiKey = data.globalSettings.GemApi;

            if (!apiKey) {
                showInputModal(
                    'Introduce tu API Key de Gemini',
                    'Necesitas una API Key de Google AI Studio para usar esta función. Se guardará de forma segura en tu dispositivo.',
                    'Tu API Key aquí...',
                    async (newKey) => {
                        data.globalSettings.GemApi = newKey;
                        await saveUnifiedData(data);
                        showNotification('API Key guardada correctamente.');
                        await askGemini(newKey, query);
                    }
                );
            } else {
                await askGemini(apiKey, query);
            }
        });
    }
    
    // Copy button logic
    if (geminiCopyBtn) {
        geminiCopyBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('gemini-response-text').innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showNotification('Respuesta copiada al portapapeles.');
            }, (err) => {
                console.error('Error al copiar texto: ', err);
                showNotification('No se pudo copiar la respuesta.', true);
            });
        });
    }

    // Close gemini response when clicking outside
    document.addEventListener('click', (e) => {
        const container = document.getElementById('google-search-widget-container');
        if (!container.contains(e.target)) {
            geminiResponseContainer.classList.add('hidden');
            googleSearchForm.classList.remove('gemini-active');
        }
    });
}
