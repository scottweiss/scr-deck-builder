/**
 * Main Deck Builder Web Component
 * Modern TypeScript web component using Vite
 */

import { BrowserDeckBuilder } from '../../browser/unified-deck-builder.js';
import type { DeckResult } from '../../browser/unified-deck-builder.js';
import { DeckBuildOptions } from '../../types/Deck.js';
import { Element } from '../../types/Card.js';

import { CardSearchComponent } from './CardSearchComponent.js';
import { DeckDisplayComponent } from './DeckDisplayComponent.js';

export class DeckBuilderApp extends HTMLElement {
  private deckBuilder: BrowserDeckBuilder;
  private isInitialized = false;

  constructor() {
    super();
    this.deckBuilder = new BrowserDeckBuilder();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.initializeDeckBuilder();
  }

  private render() {
    this.innerHTML = `
      <div class="container">
        <header>
          <h1 style="color: var(--color-primary); text-align: center; margin-bottom: var(--spacing-xl);">
            🃏 Sorcery: Contested Realm Deck Builder
          </h1>
        </header>

        <div class="card">
          <h2>Build Your Deck</h2>
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label" for="element-select">Preferred Element</label>
              <select class="form-control" id="element-select">
                <option value="">Any Element</option>
                <option value="Fire">🔥 Fire</option>
                <option value="Water">💧 Water</option>
                <option value="Earth">🌍 Earth</option>
                <option value="Air">💨 Air</option>
                <option value="Void">🌌 Void</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="archetype-select">Preferred Archetype</label>
              <select class="form-control" id="archetype-select">
                <option value="">Any Archetype</option>
                <option value="Aggro">⚡ Aggro</option>
                <option value="Control">🛡️ Control</option>
                <option value="Midrange">⚖️ Midrange</option>
                <option value="Combo">🎯 Combo</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="deck-size">Deck Size</label>
              <input type="number" class="form-control" id="deck-size" min="30" max="60" value="50">
            </div>

            <div class="form-group">
              <label class="form-label" for="avatar-name">Specific Avatar (optional)</label>
              <input type="text" class="form-control" id="avatar-name" placeholder="e.g., Merlin, Arthur">
            </div>
          </div>

          <div style="margin-top: var(--spacing-lg);">
            <button class="btn btn-primary" id="build-deck-btn">
              🎲 Build Random Deck
            </button>
            <button class="btn" id="search-cards-btn">
              🔍 Search Cards
            </button>
          </div>
        </div>

        <div id="loading-state" class="hidden">
          <div class="card text-center">
            <div class="loading">Building your deck...</div>
          </div>
        </div>

        <div id="deck-results" class="hidden">
          <deck-display></deck-display>
        </div>

        <div id="search-results" class="hidden">
          <card-search></card-search>
        </div>
      </div>
    `;
  }

  private setupEventListeners() {
    const buildButton = this.querySelector('#build-deck-btn') as HTMLButtonElement;
    const searchButton = this.querySelector('#search-cards-btn') as HTMLButtonElement;

    buildButton?.addEventListener('click', () => this.handleBuildDeck());
    searchButton?.addEventListener('click', () => this.handleSearchCards());
  }

  private async initializeDeckBuilder() {
    try {
      await this.deckBuilder.initialize();
      this.isInitialized = true;
      console.log('Deck builder initialized successfully');
    } catch (error) {
      console.error('Failed to initialize deck builder:', error);
      this.showError('Failed to load card data. Please refresh the page.');
    }
  }

  private async handleBuildDeck() {
    if (!this.isInitialized) {
      this.showError('Deck builder is still initializing. Please wait a moment.');
      return;
    }

    const elementSelect = this.querySelector('#element-select') as HTMLSelectElement;
    const archetypeSelect = this.querySelector('#archetype-select') as HTMLSelectElement;
    const deckSizeInput = this.querySelector('#deck-size') as HTMLInputElement;
    const avatarNameInput = this.querySelector('#avatar-name') as HTMLInputElement;

    // Convert string to Element enum  
    const convertToElements = (elementStr: string): Element[] | undefined => {
      if (!elementStr) return undefined;
      const elementValue = elementStr as keyof typeof Element;
      return Element[elementValue] ? [Element[elementValue]] : undefined;
    };

    const options: Partial<DeckBuildOptions> = {
      preferredElements: convertToElements(elementSelect.value),
      preferredArchetype: archetypeSelect.value || undefined,
      maxCards: parseInt(deckSizeInput.value) || 50
      // Note: avatar is now required but handled internally by the deck builder
      // which will automatically select a suitable avatar
    };

    this.showLoading();

    try {
      const result = await this.deckBuilder.buildDeck(options);
      this.showDeckResults(result);
    } catch (error) {
      console.error('Error building deck:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      this.showError(`Failed to build deck: ${message}`);
    }
  }

  private async handleSearchCards() {
    if (!this.isInitialized) {
      this.showError('Deck builder is still initializing. Please wait a moment.');
      return;
    }

    const query = prompt('Enter card name or text to search for:');
    if (!query) return;

    this.showLoading();

    try {
      const cards = await this.deckBuilder.getAllCards();
      const filtered = cards.filter(card => 
        card.name.toLowerCase().includes(query.toLowerCase()) ||
        (card.text && card.text.toLowerCase().includes(query.toLowerCase()))
      );

      const searchComponent = this.querySelector('card-search') as CardSearchComponent;
      if (searchComponent) {
        searchComponent.displayResults(filtered, query);
        this.showSearchResults();
      }
    } catch (error) {
      console.error('Error searching cards:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      this.showError(`Failed to search cards: ${message}`);
    }
  }

  private showLoading() {
    this.querySelector('#loading-state')?.classList.remove('hidden');
    this.querySelector('#deck-results')?.classList.add('hidden');
    this.querySelector('#search-results')?.classList.add('hidden');
  }

  private showDeckResults(result: DeckResult) {
    const deckDisplay = this.querySelector('deck-display') as DeckDisplayComponent;
    if (deckDisplay) {
      deckDisplay.displayDeck(result);
    }

    this.querySelector('#loading-state')?.classList.add('hidden');
    this.querySelector('#deck-results')?.classList.remove('hidden');
    this.querySelector('#search-results')?.classList.add('hidden');
  }

  private showSearchResults() {
    this.querySelector('#loading-state')?.classList.add('hidden');
    this.querySelector('#deck-results')?.classList.add('hidden');
    this.querySelector('#search-results')?.classList.remove('hidden');
  }

  private showError(message: string) {
    this.querySelector('#loading-state')?.classList.add('hidden');
    
    // Create or update error display
    let errorDiv = this.querySelector('#error-display');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'error-display';
      errorDiv.className = 'card text-error';
      this.querySelector('.container')?.appendChild(errorDiv);
    }

    errorDiv.innerHTML = `
      <h3>⚠️ Error</h3>
      <p>${message}</p>
      <button class="btn" onclick="this.parentElement.remove()">Dismiss</button>
    `;
  }
}
