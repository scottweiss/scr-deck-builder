/**
 * Main entry point for the web application
 * Modern Vite-powered Sorcery deck builder interface
 */

import './types';
import './styles/main.css';
import { DeckBuilderApp } from './components/DeckBuilderApp.js';
import { CardSearchComponent } from './components/CardSearchComponent.js';
import { DeckDisplayComponent } from './components/DeckDisplayComponent.js';

// Register custom web components
customElements.define('deck-builder-app', DeckBuilderApp);
customElements.define('card-search', CardSearchComponent);
customElements.define('deck-display', DeckDisplayComponent);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Sorcery Deck Builder - Modern Web App Initialized');
});
