// Deck Builder Web Interface JavaScript
class DeckBuilderUI {
    constructor() {
        this.form = document.getElementById('deckBuilderForm');
        this.loadingDiv = document.getElementById('loading');
        this.resultsDiv = document.getElementById('results');
        this.errorDiv = document.getElementById('error');
        this.deckOutput = document.getElementById('deckOutput');
        this.errorMessage = document.getElementById('errorMessage');
        this.avatarSelect = document.getElementById('avatar');
        this.elementSelect = document.getElementById('element');
        
        this.initializeEventListeners();
        this.init();
    }

    async init() {
        try {
            // Load available avatars
            const response = await fetch('/api/list-avatars');
            if (!response.ok) {
                throw new Error('Failed to load avatars');
            }
            
            const avatars = await response.json();
            this.populateAvatarSelect(avatars);

            // Set up element-avatar syncing
            this.elementSelect.addEventListener('change', () => this.syncAvatarWithElement());
            this.avatarSelect.addEventListener('change', () => this.validateElementAvatarSync());
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.showError('Failed to load avatar options. Please try refreshing the page.');
        }
    }

    populateAvatarSelect(avatars) {
        console.log('Populating avatars:', avatars);
        
        // Clear existing options except the default
        while (this.avatarSelect.options.length > 1) {
            this.avatarSelect.remove(1);
        }

        if (!avatars || avatars.length === 0) {
            console.warn('No avatars received from API');
            return;
        }

        // Sort avatars by element to group them
        const sortedAvatars = [...avatars].sort((a, b) => {
            const elemA = a.elements && a.elements[0] ? a.elements[0] : '';
            const elemB = b.elements && b.elements[0] ? b.elements[0] : '';
            return elemA.localeCompare(elemB);
        });

        // Add avatar options grouped by element
        let currentElement = '';
        sortedAvatars.forEach(avatar => {
            const element = avatar.elements && avatar.elements[0] ? avatar.elements[0] : 'Neutral';
            
            // Add group separator if element changed
            if (element !== currentElement) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = element;
                this.avatarSelect.appendChild(optgroup);
                currentElement = element;
            }
            
            const option = document.createElement('option');
            option.value = avatar.name;
            option.dataset.element = element;
            option.textContent = `${avatar.name} (${avatar.life || 20} Life)`;
            
            // Find the last optgroup (which should be the current element's group)
            const lastOptgroup = Array.from(this.avatarSelect.children)
                .filter(child => child.tagName === 'OPTGROUP')
                .pop();
                
            if (lastOptgroup) {
                lastOptgroup.appendChild(option);
            } else {
                // Fallback - add directly to select if no optgroup
                this.avatarSelect.appendChild(option);
            }
        });
        
        console.log('Avatar dropdown populated with', avatars.length, 'avatars');
    }

    syncAvatarWithElement() {
        const selectedElement = this.elementSelect.value;
        const currentAvatar = this.avatarSelect.value;
        
        // Only auto-select avatar if none is chosen
        if (!currentAvatar && selectedElement) {
            // Find the first avatar matching the selected element
            const matchingOption = Array.from(this.avatarSelect.options)
                .find(option => option.dataset.element === selectedElement);
            
            if (matchingOption) {
                this.avatarSelect.value = matchingOption.value;
            }
        }
    }

    validateElementAvatarSync() {
        const selectedAvatar = this.avatarSelect.selectedOptions[0];
        const selectedElement = this.elementSelect.value;
        
        if (selectedAvatar && selectedElement && 
            selectedAvatar.dataset.element !== selectedElement) {
            // Show warning about element mismatch
            const warningMsg = `Warning: The selected avatar (${selectedAvatar.textContent}) ` +
                             `is aligned with ${selectedAvatar.dataset.element}, which differs ` +
                             `from your preferred element (${selectedElement}).`;
            console.warn(warningMsg);
        }
    }

    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => this.resetForm());
        
        // Build another deck button
        document.getElementById('buildAnotherBtn').addEventListener('click', () => this.resetForm());
        
        // Try again button
        document.getElementById('tryAgainBtn').addEventListener('click', () => this.hideError());
        
        // Download button
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadDeck());
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const params = this.buildRequestParams(formData);
        
        this.showLoading();
        
        try {
            const response = await this.buildDeck(params);
            this.showResults(response);
        } catch (error) {
            this.showError(error.message);
        }
    }

    buildRequestParams(formData) {
        const params = {};
        
        // Add non-empty form values
        for (const [key, value] of formData.entries()) {
            if (value && value.trim() !== '') {
                if (key === 'exportJson' || key === 'showRules') {
                    params[key] = true;
                } else {
                    params[key] = value;
                }
            }
        }
        
        return params;
    }

    async buildDeck(params) {
        const response = await fetch('/api/build-deck', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    showLoading() {
        this.hideAllSections();
        this.loadingDiv.classList.remove('hidden');
        
        // Disable form
        const submitBtn = document.getElementById('buildBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = '🔨 Building...';
    }

    showResults(data) {
        this.hideAllSections();
        this.resultsDiv.classList.remove('hidden');
        
        // Display deck output
        this.deckOutput.innerHTML = this.formatDeckOutput(data.deckReport);
        
        // Show download button if JSON was exported
        if (data.jsonExported) {
            const downloadBtn = document.getElementById('downloadBtn');
            downloadBtn.classList.remove('hidden');
            downloadBtn.onclick = () => this.downloadJson(data.deckJson);
        }
        
        this.resetFormButton();
    }

    showError(message) {
        this.hideAllSections();
        this.errorDiv.classList.remove('hidden');
        this.errorMessage.textContent = message;
        this.resetFormButton();
    }

    hideError() {
        this.errorDiv.classList.add('hidden');
    }

    hideAllSections() {
        this.loadingDiv.classList.add('hidden');
        this.resultsDiv.classList.add('hidden');
        this.errorDiv.classList.add('hidden');
    }

    resetForm() {
        this.form.reset();
        this.hideAllSections();
        document.getElementById('downloadBtn').classList.add('hidden');
        this.resetFormButton();
    }

    resetFormButton() {
        const submitBtn = document.getElementById('buildBtn');
        submitBtn.disabled = false;
        submitBtn.textContent = '🔨 Build Deck';
    }

    formatDeckOutput(deckReport) {
        // Convert the deck report text to HTML with proper formatting
        if (!deckReport) {
            return '<p>No deck report available.</p>';
        }

        // Split by lines and format
        const lines = deckReport.split('\n');
        let html = '';
        let inCodeBlock = false;

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine === '') {
                html += '<br>';
                continue;
            }

            // Check for headers (lines starting with emojis or section markers)
            if (trimmedLine.match(/^[🎯🧙⚔️📊💎🎲]/)) {
                html += `<h4>${trimmedLine}</h4>`;
            }
            // Check for mana curve bars
            else if (trimmedLine.includes('█') || trimmedLine.includes('▓') || trimmedLine.includes('░')) {
                html += `<div class="mana-curve">${trimmedLine}</div>`;
            }
            // Check for bullet points or list items
            else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('→')) {
                html += `<div class="list-item">${trimmedLine}</div>`;
            }
            // Regular text
            else {
                html += `<p>${trimmedLine}</p>`;
            }
        }

        return html;
    }

    downloadJson(jsonData) {
        if (!jsonData) {
            alert('No JSON data available for download.');
            return;
        }

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sorcery-deck-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadDeck() {
        // This will be called when the download button is clicked
        // The actual JSON data will be set via the downloadJson method
        alert('Please use the download button that appears after deck generation.');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DeckBuilderUI();
});

// Add some additional CSS for the formatted output
const additionalStyles = `
.deck-output h4 {
    color: #4a90e2;
    margin: 1rem 0 0.5rem 0;
    border-bottom: 2px solid #e1e8ed;
    padding-bottom: 0.25rem;
}

.mana-curve {
    font-family: 'Courier New', monospace;
    background: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-left: 3px solid #4a90e2;
    margin: 0.25rem 0;
    white-space: pre;
}

.list-item {
    margin: 0.25rem 0;
    padding-left: 1rem;
    border-left: 2px solid #e1e8ed;
}

.deck-output p {
    margin: 0.5rem 0;
    line-height: 1.4;
}

.deck-output br {
    margin: 0.5rem 0;
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
