/**
 * Browser entry point for Sorcery deck builder
 * This file adapts the existing TypeScript deck building system for browser use
 */

// Import existing deck building functionality
import { processCardData } from '@/main/cardProcessor';
import { selectAvatar } from '@/main/avatarSelector';
import { Card, Element, CardType, CardRarity } from '@/types/Card';
import { Deck } from '@/types/Deck';

// Import deck building core
import * as deckBuilder from '@/core/deck/builder/deckBuilder';
import * as synergyCalculator from '@/analyses/synergy/synergyCalculator';

// Browser-compatible data loading
import { getAllCards } from '@/data/processed/sorceryCards';

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
    const deckResult = deckBuilder.buildCompleteDeck({
      minions,
      artifacts,
      auras,
      magics,
      sites,
      uniqueCards,
      avatar: selectedAvatar,
      preferredElement: options.preferredElement,
      maxCards: 50
    });

    // Calculate synergy using existing calculator
    const totalSynergy = deckResult.spellbook.reduce((total, card) => {
      return total + synergyCalculator.calculateSynergy(card, deckResult.spellbook);
    }, 0);

    return {
      deck: deckResult.spellbook,
      avatar: selectedAvatar!,
      stats: {
        totalCards: deckResult.spellbook.length,
        averageCost: deckResult.spellbook.reduce((sum, card) => sum + (card.mana_cost || 0), 0) / deckResult.spellbook.length,
        totalSynergy: totalSynergy
      },
      analysis: {
        synergy: totalSynergy,
        manaCurve: this.calculateManaCurve(deckResult.spellbook),
        elementDistribution: this.calculateElementDistribution(deckResult.spellbook),
        typeDistribution: this.calculateTypeDistribution(deckResult.spellbook)
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
        type: CardType.Avatar,
        elements: [Element.Water],
        mana_cost: 0,
        text: "Sample avatar for testing",
        power: 25,
        rarity: CardRarity.Unique,
        // Required properties from Card interface
        baseName: "Sample Avatar",
        cost: 0,
        productId: "sample-01",
        cleanName: "sample-avatar",
        imageUrl: "",
        categoryId: "avatar",
        groupId: "sample",
        url: "",
        modifiedOn: new Date().toISOString(),
        imageCount: "1",
        extRarity: "Unique",
        extDescription: "Sample avatar for testing",
        extCost: "0",
        extThreshold: "",
        extElement: "Water",
        extTypeLine: "Avatar",
        extCardCategory: "Avatar",
        extCardType: "Avatar",
        subTypeName: "",
        extPowerRating: "25",
        extCardSubtype: "",
        extFlavorText: "A sample avatar created for testing purposes",
        extDefensePower: "0",
        extLife: "0",
        setName: "Beta"
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
