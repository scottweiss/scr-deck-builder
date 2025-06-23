/**
 * Main entry point for the web application
 * Modern Vite-powered Sorcery deck builder interface
 */

import './types';
import './styles/main.css';
import { BrowserDeckBuilder } from '../browser/unified-deck-builder';

// Initialize the deck builder when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = document.querySelector<HTMLDivElement>('#app');
  
  if (!app) {
    console.error('App container not found');
    return;
  }

  // Create the UI
  app.innerHTML = `
    <div class="deck-builder-app">
      <header class="app-header">
        <h1>🎯 Sorcery: Contested Realm</h1>
        <h2>Deck Builder</h2>
      </header>
      
      <main class="app-main">
        <div class="builder-form">
          <div class="form-group">
            <label for="avatar-select">Avatar:</label>
            <select id="avatar-select" class="form-control">
              <option value="">Loading avatars...</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Elements:</label>
            <div class="element-checkboxes">
              <label><input type="checkbox" value="Water" /> 💧 Water</label>
              <label><input type="checkbox" value="Fire" /> 🔥 Fire</label>
              <label><input type="checkbox" value="Earth" /> 🌍 Earth</label>
              <label><input type="checkbox" value="Air" /> 💨 Air</label>
              <label><input type="checkbox" value="Void" /> 🌌 Void</label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="archetype-select">Archetype:</label>
            <select id="archetype-select" class="form-control">
              <option value="">Auto-select</option>
              <option value="Aggro">⚡ Aggro</option>
              <option value="Control">🛡️ Control</option>
              <option value="Midrange">⚖️ Midrange</option>
              <option value="Combo">🔗 Combo</option>
            </select>
          </div>
          
          <button id="build-button" class="build-button">🚀 Build Deck</button>
        </div>
        
        <div id="deck-results" class="deck-results hidden">
          <h3>📋 Deck Results</h3>
          <div id="deck-summary"></div>
          <div id="deck-list"></div>
        </div>
      </main>
    </div>
  `;

  // Initialize deck builder
  const deckBuilder = new BrowserDeckBuilder();
  await deckBuilder.initialize();

  // Load avatars
  const avatarSelect = document.getElementById('avatar-select') as HTMLSelectElement;
  const avatars = await deckBuilder.getAvatars();
  
  avatarSelect.innerHTML = '<option value="">Choose an avatar</option>';
  avatars.forEach(avatar => {
    const option = document.createElement('option');
    option.value = avatar.name;
    option.textContent = avatar.name;
    avatarSelect.appendChild(option);
  });

  // Handle build button click
  const buildButton = document.getElementById('build-button');
  buildButton?.addEventListener('click', async () => {
    const selectedElements = Array.from(
      document.querySelectorAll('.element-checkboxes input:checked')
    ).map(input => (input as HTMLInputElement).value);
    
    const archetype = (document.getElementById('archetype-select') as HTMLSelectElement).value;
    const avatarName = avatarSelect.value;

    try {
      const result = await deckBuilder.buildDeck({
        preferredElements: selectedElements,
        archetype: archetype || undefined,
        avatar: avatarName || undefined
      });

      displayDeckResults(result);
    } catch (error) {
      console.error('Failed to build deck:', error);
      alert('Failed to build deck. Please try again.');
    }
  });
});

function displayDeckResults(result: any) {
  const resultsDiv = document.getElementById('deck-results');
  const summaryDiv = document.getElementById('deck-summary');
  const listDiv = document.getElementById('deck-list');
  
  if (!resultsDiv || !summaryDiv || !listDiv) return;
  
  resultsDiv.classList.remove('hidden');
  
  // Display summary
  summaryDiv.innerHTML = `
    <div class="deck-stats">
      <p><strong>Avatar:</strong> ${result.avatar?.name || 'None'}</p>
      <p><strong>Total Cards:</strong> ${result.stats?.totalCards || 0}</p>
      <p><strong>Average Mana Cost:</strong> ${result.stats?.averageCost?.toFixed(2) || 'N/A'}</p>
      <p><strong>Synergy Score:</strong> ${result.stats?.totalSynergy || 0}</p>
    </div>
  `;
  
  // Display deck list
  let deckListHtml = '<h4>Deck List:</h4><ul>';
  if (result.deck && Array.isArray(result.deck)) {
    const cardCounts: { [name: string]: number } = {};
    result.deck.forEach((card: any) => {
      cardCounts[card.name] = (cardCounts[card.name] || 0) + 1;
    });
    
    Object.entries(cardCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([name, count]) => {
        deckListHtml += `<li>${count}x ${name}</li>`;
      });
  }
  deckListHtml += '</ul>';
  
  listDiv.innerHTML = deckListHtml;
}
