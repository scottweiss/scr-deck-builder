// Global type declarations for the web application

import type { DeckDisplayComponent } from './components/DeckDisplayComponent';
import type { CardSearchComponent } from './components/CardSearchComponent';

declare global {
  interface HTMLElementTagNameMap {
    'deck-builder-app': import('./components/DeckBuilderApp').DeckBuilderApp;
    'deck-display': DeckDisplayComponent;
    'card-search': CardSearchComponent;
  }
}

export {};
