// Main UI application logic for the browser deck builder
(async function() {
    'use strict';

    let deckBuilder = null;
    let currentDeck = null;

    // DOM elements
    const elements = {
        loading: document.getElementById('loading'),
        form: document.getElementById('deckBuilderForm'),
        avatarSelect: document.getElementById('avatar'),
        elementSelect: document.getElementById('element'),
        archetypeSelect: document.getElementById('archetype'),
        buildButton: document.getElementById('buildButton'),
        error: document.getElementById('error'),
        errorMessage: document.getElementById('errorMessage'),
        results: document.getElementById('results'),
        deckSummary: document.getElementById('deckSummary'),
        validationResults: document.getElementById('validationResults'),
        avatarInfo: document.getElementById('avatarInfo'),
        sitesList: document.getElementById('sitesList'),
        spellsList: document.getElementById('spellsList'),
        exportJson: document.getElementById('exportJson'),
        exportText: document.getElementById('exportText'),
        copyDeckList: document.getElementById('copyDeckList')
    };

    // Utility functions
    function showElement(element) {
        element.classList.remove('hidden');
    }

    function hideElement(element) {
        element.classList.add('hidden');
    }

    function showError(message) {
        elements.errorMessage.textContent = message;
        showElement(elements.error);
        hideElement(elements.results);
    }

    function hideError() {
        hideElement(elements.error);
    }

    function showLoading() {
        showElement(elements.loading);
        elements.buildButton.disabled = true;
        elements.buildButton.textContent = '⏳ Building...';
    }

    function hideLoading() {
        hideElement(elements.loading);
        elements.buildButton.disabled = false;
        elements.buildButton.textContent = '🚀 Build Deck';
    }

    // Initialize the deck builder
    async function initializeDeckBuilder() {
        try {
            showLoading();
            
            // Wait for the global deck builder to be available
            while (typeof window.RealSorceryDeckBuilder === 'undefined') {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            deckBuilder = new window.RealSorceryDeckBuilder();
            await deckBuilder.loadCardData();

            // Populate avatar dropdown
            await populateAvatars();

            hideLoading();
            console.log('Real Sorcery deck builder initialized successfully');
        } catch (error) {
            console.error('Failed to initialize deck builder:', error);
            showError('Failed to initialize deck builder. Please refresh the page and try again.');
            hideLoading();
        }
    }

    // Populate avatars dropdown
    async function populateAvatars() {
        try {
            const avatars = await deckBuilder.getAvatars();
            elements.avatarSelect.innerHTML = '<option value="">Select an Avatar</option>';
            
            avatars.forEach(avatar => {
                const option = document.createElement('option');
                option.value = avatar.name;
                option.textContent = `${getElementIcon(avatar.elements?.[0] || '')} ${avatar.name}`;
                elements.avatarSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to populate avatars:', error);
        }
    }

    // Get element icon
    function getElementIcon(element) {
        const icons = {
            'Water': '💧',
            'Fire': '🔥',
            'Earth': '🌍',
            'Air': '💨',
            'Void': '🌌'
        };
        return icons[element] || '⚡';
    }

    // Get element color
    function getElementColor(element) {
        const colors = {
            'Water': '#3b82f6',
            'Fire': '#ef4444',
            'Earth': '#22c55e',
            'Air': '#8b5cf6',
            'Void': '#6b7280'
        };
        return colors[element] || '#6b7280';
    }

    // Handle form submission
    async function handleBuildDeck(event) {
        event.preventDefault();
        
        if (!deckBuilder) {
            showError('Deck builder not initialized. Please refresh the page.');
            return;
        }

        try {
            showLoading();
            hideError();

            const formData = new FormData(elements.form);
            const preferences = {
                preferredElements: formData.get('element') ? [formData.get('element')] : [],
                preferredArchetype: formData.get('archetype') || 'Midrange',
                avatarName: formData.get('avatar') || null
            };

            console.log('Building deck with preferences:', preferences);
            const result = await deckBuilder.buildDeck(preferences);
            
            // Transform result to match expected format
            currentDeck = {
                spells: result.spells,
                sites: result.sites,
                stats: result.stats,
                summary: {
                    totalCards: result.stats.totalCards,
                    spellsCount: result.stats.spellsCount,
                    sitesCount: result.stats.sitesCount,
                    avgManaCost: result.stats.averageManaCost,
                    elements: Object.keys(result.stats.elements),
                    archetypes: Object.keys(result.stats.archetypes)
                },
                validation: {
                    isValid: result.stats.spellsCount === 50 && result.stats.sitesCount === 30,
                    warnings: getValidationWarnings(result.stats),
                    suggestions: []
                },
                spellsList: generateDeckList(result.spells),
                sitesList: generateDeckList(result.sites)
            };
            
            displayDeckResults(currentDeck);
            showElement(elements.results);
            hideLoading();

        } catch (error) {
            console.error('Failed to build deck:', error);
            showError(`Failed to build deck: ${error.message}`);
            hideLoading();
        }
    }

    // Generate validation warnings based on deck stats
    function getValidationWarnings(stats) {
        const warnings = [];
        
        if (stats.spellsCount !== 50) {
            warnings.push(`Spellbook has ${stats.spellsCount} cards instead of 50`);
        }
        
        if (stats.sitesCount !== 30) {
            warnings.push(`Sites deck has ${stats.sitesCount} cards instead of 30`);
        }
        
        return warnings;
    }

    // Generate deck list with card counts
    function generateDeckList(deck) {
        const cardCounts = {};
        deck.forEach(card => {
            cardCounts[card.name] = (cardCounts[card.name] || 0) + 1;
        });
        
        return Object.entries(cardCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }

    // Display deck results
    function displayDeckResults(result) {
        // Display summary
        displayDeckSummary(result.summary);
        
        // Display validation
        displayValidationResults(result.validation);
        
        // Display avatar (none for now since we don't have avatar selection working)
        displayAvatarInfo(null);
        
        // Display sites with actual site cards
        displaySites(result.sitesList);
        
        // Display spells
        displaySpells(result.spellsList);
    }

    // Display deck summary
    function displayDeckSummary(summary, avatar) {
        const elementsHtml = summary.elements.map(element => 
            `<span class="element-badge" style="background-color: ${getElementColor(element)}">${getElementIcon(element)} ${element}</span>`
        ).join(' ');

        elements.deckSummary.innerHTML = `
            <div class="summary-item">
                <span class="label">Total Cards:</span>
                <span class="value">${summary.totalCards} (${summary.spellsCount} spells + ${summary.sitesCount} sites)</span>
            </div>
            <div class="summary-item">
                <span class="label">Avg Mana Cost:</span>
                <span class="value">${summary.avgManaCost}</span>
            </div>
            <div class="summary-item">
                <span class="label">Elements:</span>
                <span class="value">${elementsHtml}</span>
            </div>
            <div class="summary-item">
                <span class="label">Archetype:</span>
                <span class="value">${summary.archetypes.join(', ')}</span>
            </div>
        `;
    }

    // Display validation results
    function displayValidationResults(validation) {
        let html = `<div class="validation-status ${validation.isValid ? 'valid' : 'invalid'}">
            ${validation.isValid ? '✅ Deck is valid' : '❌ Deck has issues'}
        </div>`;

        if (validation.warnings.length > 0) {
            html += '<div class="warnings"><h4>⚠️ Warnings:</h4><ul>';
            validation.warnings.forEach(warning => {
                html += `<li>${warning}</li>`;
            });
            html += '</ul></div>';
        }

        if (validation.suggestions.length > 0) {
            html += '<div class="suggestions"><h4>💡 Suggestions:</h4><ul>';
            validation.suggestions.forEach(suggestion => {
                html += `<li>${suggestion}</li>`;
            });
            html += '</ul></div>';
        }

        elements.validationResults.innerHTML = html;
    }

    // Display avatar info
    function displayAvatarInfo(avatar) {
        if (!avatar) {
            elements.avatarInfo.innerHTML = '<p>No avatar selected</p>';
            return;
        }

        const elementsHtml = (avatar.elements || []).map(element => 
            `<span class="element-badge" style="background-color: ${getElementColor(element)}">${getElementIcon(element)} ${element}</span>`
        ).join(' ');

        elements.avatarInfo.innerHTML = `
            <div class="card-item avatar-card">
                <div class="card-header">
                    <span class="card-name">${avatar.name}</span>
                    ${elementsHtml}
                </div>
                ${avatar.rule_text ? `<div class="card-text">${avatar.rule_text}</div>` : ''}
                ${avatar.mana_cost ? `<div class="mana-cost">Mana: ${avatar.mana_cost}</div>` : ''}
            </div>
        `;
    }

    // Display sites
    function displaySites(sitesList) {
        if (!sitesList || sitesList.length === 0) {
            elements.sitesList.innerHTML = '<p>No sites in deck</p>';
            return;
        }

        const sitesHtml = sitesList.map(siteItem => {
            const count = siteItem.count;
            const name = siteItem.name;
            const countText = count > 1 ? ` ${count}x` : '';

            return `
                <div class="card-item site-card">
                    <span class="card-name">- ${name}${countText}</span>
                </div>
            `;
        }).join('');

        elements.sitesList.innerHTML = sitesHtml;
    }

    // Display spells
    function displaySpells(deckList) {
        if (!deckList || deckList.length === 0) {
            elements.spellsList.innerHTML = '<p>No spells in deck</p>';
            return;
        }

        const spellsHtml = deckList.map(({ name, count }) => `
            <div class="card-item spell-card">
                <span class="card-name">${name}</span>
                <span class="card-count">${count > 1 ? `${count}x` : ''}</span>
            </div>
        `).join('');

        elements.spellsList.innerHTML = spellsHtml;
    }

    // Export functions
    function exportAsJson() {
        if (!currentDeck) return;
        
        const exportData = {
            avatar: null, // No avatar selection yet
            sites: currentDeck.sitesList,
            spells: currentDeck.spellsList,
            summary: currentDeck.summary,
            validation: currentDeck.validation,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sorcery-deck-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportAsText() {
        if (!currentDeck) return;

        let text = `Sorcery: Contested Realm - Deck List\n`;
        text += `Generated: ${new Date().toLocaleDateString()}\n\n`;
        
        text += `Sites (${currentDeck.summary.sitesCount}):\n`;
        currentDeck.sitesList.forEach(({ name, count }) => {
            if (count === 1) {
                text += `- ${name}\n`;
            } else {
                text += `- ${name} ${count}x\n`;
            }
        });
        
        text += `\nSpellbook (${currentDeck.summary.spellsCount}):\n`;
        currentDeck.spellsList.forEach(({ name, count }) => {
            if (count === 1) {
                text += `- ${name}\n`;
            } else {
                text += `- ${name} ${count}x\n`;
            }
        });

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sorcery-deck-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function copyDeckList() {
        if (!currentDeck) return;

        let text = `Sorcery Deck\n\n`;
        text += `Sites (${currentDeck.summary.sitesCount}):\n`;
        currentDeck.sitesList.forEach(({ name, count }) => {
            if (count === 1) {
                text += `${name}\n`;
            } else {
                text += `${name} ${count}x\n`;
            }
        });
        
        text += `\nSpellbook (${currentDeck.summary.spellsCount}):\n`;
        currentDeck.spellsList.forEach(({ name, count }) => {
            if (count === 1) {
                text += `${name}\n`;
            } else {
                text += `${name} ${count}x\n`;
            }
        });

        try {
            await navigator.clipboard.writeText(text);
            
            // Show feedback
            const originalText = elements.copyDeckList.textContent;
            elements.copyDeckList.textContent = '✅ Copied!';
            setTimeout(() => {
                elements.copyDeckList.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            showError('Failed to copy to clipboard. Please try selecting and copying manually.');
        }
    }

    // Event listeners
    elements.form.addEventListener('submit', handleBuildDeck);
    elements.exportJson.addEventListener('click', exportAsJson);
    elements.exportText.addEventListener('click', exportAsText);
    elements.copyDeckList.addEventListener('click', copyDeckList);

    // Initialize when page loads
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Page loaded, initializing deck builder...');
        initializeDeckBuilder();
    });

    // Initialize immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        // Loading hasn't finished yet
    } else {
        console.log('DOM already loaded, initializing deck builder...');
        initializeDeckBuilder();
    }
})();
