// --- Módulo de Búsqueda de Google ---

export function initSearch() {
    const googleSearchForm = document.getElementById('google-search-form');
    const googleSearchInput = document.getElementById('google-search-input');

    if (googleSearchForm) {
        googleSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = googleSearchInput.value.trim();
            if (query) {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                window.open(searchUrl, '_blank');
                googleSearchInput.value = '';
            }
        });
    }
}
