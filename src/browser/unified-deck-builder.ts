import { Card, Element } from '../types/Card';
import { Deck, DeckBuildOptions } from '../types/Deck';
import { processCardData } from '../main/cardProcessor';
import { selectAvatar } from '../main/avatarSelector';
import { validateDeck } from '../main/deckValidation';
import * as deckBuilder from '../core/deck/builder/deckBuilder';
import * as siteSelector from '../analyses/position/siteSelector';
import * as synergyCalculator from '../analyses/synergy/synergyCalculator';
import { analyzeCardCombos } from '../core/deck/analysis/comboDetection';

/**
 * Unified deck building interface for both CLI and browser use
 */
export interface UnifiedDeckBuilder {
  buildDeck(options: DeckBuildOptions): Promise<DeckResult>;
  getAllCards(): Promise<Card[]>;
  getAvatars(elementFilter?: Element[]): Promise<Card[]>;
  getSites(elementFilter?: Element[]): Promise<Card[]>;
  calculateSynergy(deck: Card[]): Promise<number>;
  detectCombos(deck: Card[]): Promise<any[]>;
  validateDeck(deck: Deck): Promise<any>;
}

export interface DeckResult {
  deck: Deck;
  avatar: Card;
  sites: Card[];
  spells: Card[];
  stats: DeckStats;
  validation: any;
  synergy: number;
  combos: any[];
}

export interface DeckStats {
  totalCards: number;
  spellsCount: number;
  sitesCount: number;
  averageManaCost: number;
  manaCurve: Record<number, number>;
  elementDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  archetypeDistribution: Record<string, number>;
}

/**
 * Browser-compatible deck builder that uses the TypeScript system
 */
export class BrowserDeckBuilder implements UnifiedDeckBuilder {
  public cardData: any = null;
  public isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Loading Sorcery card data...');
    
    try {
      // Process card data using existing TypeScript function
      this.cardData = await processCardData(['Beta', 'ArthurianLegends']);
      this.isInitialized = true;
      console.log(`Loaded ${this.cardData.uniqueCards.length} cards`);
    } catch (error) {
      console.error('Failed to load card data:', error);
      throw error;
    }
  }

  async buildDeck(options: Partial<DeckBuildOptions> = {}): Promise<DeckResult> {
    await this.initialize();

    const { uniqueCards, avatars, sites, minions, artifacts, auras, magics, keywords, elements } = this.cardData;

    // Select avatar using existing TypeScript function
    const avatarResult = selectAvatar(
      avatars, 
      elements, 
      keywords, 
      uniqueCards, 
      options.preferredElement || options.preferredElements?.[0]
    );
    const selectedAvatar = avatarResult.selectedAvatar;
    const dominantElement = avatarResult.dominantElement;

    // Select sites using existing TypeScript function
    const selectedSites: Card[] = siteSelector.selectSites(sites, dominantElement, 30);

    // Build spellbook using existing TypeScript function
    const spellbookResult = deckBuilder.buildSpellbook({
      minions,
      artifacts,
      auras,
      magics,
      uniqueCards,
      sites: selectedSites,
      avatar: selectedAvatar,
      preferredArchetype: options.preferredArchetype,
      maxCards: options.maxCards || 50
    });

    const selectedSpells = spellbookResult.spells;

    // Calculate synergy using existing TypeScript function
    const totalSynergy = await this.calculateSynergy(selectedSpells);

    // Detect combos using existing TypeScript function
    const combos = await this.detectCombos(selectedSpells);

    // Create deck object with proper interface
    const deck: Deck = {
      avatar: selectedAvatar,
      spellbook: selectedSpells, // Use spellbook instead of spells
      sites: selectedSites,
      metadata: {
        createdAt: new Date(),
        totalSynergy,
        playabilityScore: totalSynergy * 0.8 // Simple calculation
      }
    };

    // Validate deck using existing TypeScript function
    const validation = await this.validateDeck(deck);

    // Calculate statistics
    const stats = this.calculateDeckStats(selectedSpells, selectedSites);

    return {
      deck,
      avatar: selectedAvatar || { name: 'Unknown', type: 'Avatar' } as Card,
      sites: selectedSites,
      spells: selectedSpells,
      stats,
      validation,
      synergy: totalSynergy,
      combos
    };
  }

  async getAllCards(): Promise<Card[]> {
    await this.initialize();
    return this.cardData.uniqueCards;
  }

  async getAvatars(elementFilter?: Element[]): Promise<Card[]> {
    await this.initialize();
    const avatars = this.cardData.avatars;
    
    if (!elementFilter || elementFilter.length === 0) {
      return avatars;
    }
    
    return avatars.filter((avatar: Card) => 
      avatar.elements && avatar.elements.some((element: Element) => elementFilter.includes(element))
    );
  }

  async getSites(elementFilter?: Element[]): Promise<Card[]> {
    await this.initialize();
    const sites = this.cardData.sites;
    
    if (!elementFilter || elementFilter.length === 0) {
      return sites;
    }
    
    return sites.filter((site: Card) => 
      site.elements && site.elements.some((element: Element) => elementFilter.includes(element))
    );
  }

  async calculateSynergy(deck: Card[]): Promise<number> {
    // Use the existing synergy calculator - it expects (card, deck) parameters
    let totalSynergy = 0;
    deck.forEach(card => {
      totalSynergy += synergyCalculator.calculateSynergy(card, deck);
    });
    return totalSynergy / Math.max(deck.length, 1);
  }

  async detectCombos(deck: Card[]): Promise<any[]> {
    // Mock combo detection for now - the real function needs more parameters
    // TODO: Implement proper combo detection with required parameters
    return [];
  }

  async validateDeck(deck: Deck): Promise<any> {
    return validateDeck(deck.avatar, deck.sites, deck.spellbook);
  }

  private calculateDeckStats(spells: Card[], sites: Card[]): DeckStats {
    const totalCards = spells.length + sites.length;
    const spellsCount = spells.length;
    const sitesCount = sites.length;

    // Calculate average mana cost
    const totalManaCost = spells.reduce((sum, card) => sum + (card.mana_cost || 0), 0);
    const averageManaCost = spellsCount > 0 ? totalManaCost / spellsCount : 0;

    // Calculate mana curve
    const manaCurve: Record<number, number> = {};
    spells.forEach(card => {
      const cost = card.mana_cost || 0;
      manaCurve[cost] = (manaCurve[cost] || 0) + 1;
    });

    // Calculate element distribution
    const elementDistribution: Record<string, number> = {};
    [...spells, ...sites].forEach(card => {
      if (card.elements) {
        card.elements.forEach((element: Element) => {
          elementDistribution[element] = (elementDistribution[element] || 0) + 1;
        });
      }
    });

    // Calculate type distribution
    const typeDistribution: Record<string, number> = {};
    spells.forEach(card => {
      const type = card.type || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Calculate archetype distribution - using text analysis since archetype property doesn't exist
    const archetypeDistribution: Record<string, number> = {};
    spells.forEach(card => {
      const text = card.text || card.extDescription || '';
      const textLower = text.toLowerCase();
      
      // Simple archetype detection based on card text
      if (textLower.includes('damage') || textLower.includes('attack') || textLower.includes('haste')) {
        archetypeDistribution['Aggro'] = (archetypeDistribution['Aggro'] || 0) + 1;
      } else if (textLower.includes('draw') || textLower.includes('counter') || textLower.includes('destroy')) {
        archetypeDistribution['Control'] = (archetypeDistribution['Control'] || 0) + 1;
      } else {
        archetypeDistribution['Midrange'] = (archetypeDistribution['Midrange'] || 0) + 1;
      }
    });

    return {
      totalCards,
      spellsCount,
      sitesCount,
      averageManaCost,
      manaCurve,
      elementDistribution,
      typeDistribution,
      archetypeDistribution
    };
  }

  // Additional convenience methods for browser use
  getAvailableElements(): string[] {
    return ['Water', 'Fire', 'Earth', 'Air', 'Void'];
  }

  getAvailableArchetypes(): string[] {
    return ['Aggro', 'Control', 'Midrange', 'Combo'];
  }

  async searchCards(query: string): Promise<Card[]> {
    const allCards = await this.getAllCards();
    const lowerQuery = query.toLowerCase();
    
    return allCards.filter(card => 
      card.name.toLowerCase().includes(lowerQuery) ||
      (card.text && card.text.toLowerCase().includes(lowerQuery)) ||
      (card.extDescription && card.extDescription.toLowerCase().includes(lowerQuery))
    ).slice(0, 20);
  }
}

// Export for browser use
export default BrowserDeckBuilder;
