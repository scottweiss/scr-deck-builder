/**
 * Browser entry point for Sorcery deck builder
 * This file adapts the existing TypeScript deck building system for browser use
 */

// Import existing deck building functionality
import { processCardData } from '../../src/main/cardProcessor';
import { selectAvatar } from '../../src/main/avatarSelector';
import { Card, Element } from '../../src/types/Card';
import { Deck } from '../../src/types/Deck';

// Import deck building core
import * as deckBuilder from '../../../src/core/deck/builder/deckBuilder';
import * as synergyCalculator from '../../src/analyses/synergy/synergyCalculator';

// Browser-compatible data loading
import { getAllCards } from '../../src/data/processed/sorceryCards';

/**
 * Browser-compatible deck building interface
 */
export class BrowserDeckBuilder {
  private cards: Card[] = [];
  private loaded: boolean = false;

  /**
   * Initialize the deck builder with card data
   */
  async initialize(): Promise<void> {
    if (this.loaded) return;
    
    try {
      console.log('Loading Sorcery card data...');
      this.cards = await getAllCards();
      this.loaded = true;
      console.log(`Loaded ${this.cards.length} cards`);
    } catch (error) {
      console.error('Failed to load card data:', error);
      // Fallback to sample data if real data fails
      this.cards = this.getSampleCards();
      this.loaded = true;
    }
  }

  /**
   * Build a deck with the specified options
   */
  async buildDeck(options: {
    preferredElement?: Element;
    archetype?: string;
    avatar?: string;
  }): Promise<{
    deck: Card[];
    avatar: Card;
    stats: any;
    analysis: any;
  }> {
    await this.initialize();

    // Process card data using existing function
    const cardData = await processCardData(['Beta', 'ArthurianLegends']);
    const { uniqueCards, avatars, sites, minions, artifacts, auras, magics, keywords, elements } = cardData;

    // Select avatar using existing function
    const avatarResult = selectAvatar(avatars, elements, keywords, uniqueCards, options.preferredElement);
    const selectedAvatar = avatarResult.selectedAvatar;

    // Build deck using existing deck builder
    const deckResult = await deckBuilder.buildDeck({
      avatar: selectedAvatar,
      cards: uniqueCards,
      sites: sites,
      minions: minions,
      artifacts: artifacts,
      auras: auras,
      magics: magics,
      preferredElement: options.preferredElement,
      archetype: options.archetype
    });

    // Calculate synergy using existing calculator
    const synergyData = synergyCalculator.calculateDeckSynergy(deckResult.deck, selectedAvatar);

    return {
      deck: deckResult.deck,
      avatar: selectedAvatar,
      stats: deckResult.stats,
      analysis: {
        synergy: synergyData,
        manaCurve: this.calculateManaCurve(deckResult.deck),
        elementDistribution: this.calculateElementDistribution(deckResult.deck),
        typeDistribution: this.calculateTypeDistribution(deckResult.deck)
      }
    };
  }

  /**
   * Get available avatars
   */
  async getAvatars(): Promise<Card[]> {
    await this.initialize();
    return this.cards.filter(card => card.type === 'Avatar');
  }

  /**
   * Get available elements
   */
  async getElements(): Promise<Element[]> {
    return [Element.Water, Element.Fire, Element.Earth, Element.Air, Element.Void];
  }

  /**
   * Search cards by name
   */
  async searchCards(query: string): Promise<Card[]> {
    await this.initialize();
    const lowerQuery = query.toLowerCase();
    return this.cards.filter(card => 
      card.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 20); // Limit results
  }

  /**
   * Get cards by type
   */
  async getCardsByType(type: string): Promise<Card[]> {
    await this.initialize();
    return this.cards.filter(card => card.type === type);
  }

  /**
   * Calculate mana curve distribution
   */
  private calculateManaCurve(deck: Card[]): { [cost: number]: number } {
    const curve: { [cost: number]: number } = {};
    deck.forEach(card => {
      const cost = Math.min(card.mana_cost || 0, 7);
      curve[cost] = (curve[cost] || 0) + 1;
    });
    return curve;
  }

  /**
   * Calculate element distribution
   */
  private calculateElementDistribution(deck: Card[]): { [element: string]: number } {
    const distribution: { [element: string]: number } = {};
    deck.forEach(card => {
      if (card.elements) {
        card.elements.forEach(element => {
          distribution[element] = (distribution[element] || 0) + 1;
        });
      }
    });
    return distribution;
  }

  /**
   * Calculate type distribution
   */
  private calculateTypeDistribution(deck: Card[]): { [type: string]: number } {
    const distribution: { [type: string]: number } = {};
    deck.forEach(card => {
      distribution[card.type] = (distribution[card.type] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Fallback sample cards if real data loading fails
   */
  private getSampleCards(): Card[] {
    return [
      {
        name: "Sample Avatar",
        type: "Avatar",
        elements: [Element.Water],
        mana_cost: 0,
        text: "Sample avatar for testing",
        power: 25,
        rarity: "Unique"
      },
      // Add more sample cards as needed
    ];
  }
}

// Export for global use
declare global {
  interface Window {
    SorceryDeckBuilder: typeof BrowserDeckBuilder;
  }
}

if (typeof window !== 'undefined') {
  window.SorceryDeckBuilder = BrowserDeckBuilder;
}

export default BrowserDeckBuilder;
