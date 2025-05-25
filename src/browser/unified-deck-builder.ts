import { Card, Element, CardType, CardRarity } from '../types/Card';
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
    // This will throw an error if no avatars are available
    const avatarResult = selectAvatar(
      avatars, 
      elements, 
      keywords, 
      uniqueCards, 
      options.preferredElement || options.preferredElements?.[0]
    );
    // Avatar is now guaranteed to be defined
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
      avatar: selectedAvatar, // No need for fallback as avatar is now required
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

  getSampleCardData(): {
    uniqueCards: Card[];
    avatars: Card[];
    sites: Card[];
    minions: Card[];
    artifacts: Card[];
    auras: Card[];
    magics: Card[];
  } {
    // Create sample card data for testing and fallback scenarios
    const sampleCards: Card[] = [
      // Sample Avatars
      {
        productId: 'sample_avatar_1',
        name: 'Merlin',
        cleanName: 'merlin',
        type: CardType.Avatar,
        mana_cost: 0,
        cost: 0,
        elements: [Element.Water],
        text: 'At the beginning of your turn, draw an additional card.',
        power: 25,
        rarity: CardRarity.Unique,
        baseName: 'Merlin',
        imageUrl: '',
        categoryId: 'avatar',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Unique',
        extDescription: 'At the beginning of your turn, draw an additional card.',
        extCost: '0',
        extThreshold: 'WWW',
        extElement: 'Water',
        extTypeLine: 'Avatar',
        extCardCategory: 'Avatar',
        extCardType: 'Avatar',
        subTypeName: '',
        extPowerRating: '25',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '0',
        setName: 'Sample',
        threshold: 'WWW',
        subtype: ''
      },
      {
        productId: 'sample_avatar_2',
        name: 'Arthur',
        cleanName: 'arthur',
        type: CardType.Avatar,
        mana_cost: 0,
        cost: 0,
        elements: [Element.Fire],
        text: 'Your minions have +1 attack.',
        power: 25,
        rarity: CardRarity.Unique,
        baseName: 'Arthur',
        imageUrl: '',
        categoryId: 'avatar',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Unique',
        extDescription: 'Your minions have +1 attack.',
        extCost: '0',
        extThreshold: 'FFF',
        extElement: 'Fire',
        extTypeLine: 'Avatar',
        extCardCategory: 'Avatar',
        extCardType: 'Avatar',
        subTypeName: '',
        extPowerRating: '25',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '0',
        setName: 'Sample',
        threshold: 'FFF',
        subtype: ''
      },
      // Sample Sites
      {
        productId: 'sample_site_1',
        name: 'Mystical Springs',
        cleanName: 'mystical_springs',
        type: CardType.Site,
        mana_cost: 0,
        cost: 0,
        elements: [Element.Water],
        text: 'Tap: Add Water to your mana pool.',
        power: 0,
        rarity: CardRarity.Common,
        baseName: 'Mystical Springs',
        imageUrl: '',
        categoryId: 'site',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Common',
        extDescription: 'Tap: Add Water to your mana pool.',
        extCost: '0',
        extThreshold: '',
        extElement: 'Water',
        extTypeLine: 'Site',
        extCardCategory: 'Site',
        extCardType: 'Site',
        subTypeName: '',
        extPowerRating: '',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '',
        setName: 'Sample',
        threshold: '',
        subtype: ''
      },
      {
        productId: 'sample_site_2',
        name: 'Volcanic Peak',
        cleanName: 'volcanic_peak',
        type: CardType.Site,
        mana_cost: 0,
        cost: 0,
        elements: [Element.Fire],
        text: 'Tap: Add Fire to your mana pool.',
        power: 0,
        rarity: CardRarity.Common,
        baseName: 'Volcanic Peak',
        imageUrl: '',
        categoryId: 'site',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Common',
        extDescription: 'Tap: Add Fire to your mana pool.',
        extCost: '0',
        extThreshold: '',
        extElement: 'Fire',
        extTypeLine: 'Site',
        extCardCategory: 'Site',
        extCardType: 'Site',
        subTypeName: '',
        extPowerRating: '',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '',
        setName: 'Sample',
        threshold: '',
        subtype: ''
      },
      // Sample Minions
      {
        productId: 'sample_minion_1',
        name: 'Water Elemental',
        cleanName: 'water_elemental',
        type: CardType.Minion,
        mana_cost: 3,
        cost: 3,
        elements: [Element.Water],
        text: 'When summoned, draw a card.',
        power: 2,
        life: 3,
        rarity: CardRarity.Common,
        baseName: 'Water Elemental',
        imageUrl: '',
        categoryId: 'minion',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Common',
        extDescription: 'When summoned, draw a card.',
        extCost: '3',
        extThreshold: 'W',
        extElement: 'Water',
        extTypeLine: 'Minion',
        extCardCategory: 'Minion',
        extCardType: 'Minion',
        subTypeName: '',
        extPowerRating: '2',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '3',
        setName: 'Sample',
        threshold: 'W',
        subtype: ''
      },
      {
        productId: 'sample_minion_2',
        name: 'Fire Sprite',
        cleanName: 'fire_sprite',
        type: CardType.Minion,
        mana_cost: 2,
        cost: 2,
        elements: [Element.Fire],
        text: 'Haste. When summoned, deal 1 damage.',
        power: 2,
        life: 1,
        rarity: CardRarity.Common,
        baseName: 'Fire Sprite',
        imageUrl: '',
        categoryId: 'minion',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Common',
        extDescription: 'Haste. When summoned, deal 1 damage.',
        extCost: '2',
        extThreshold: 'F',
        extElement: 'Fire',
        extTypeLine: 'Minion',
        extCardCategory: 'Minion',
        extCardType: 'Minion',
        subTypeName: '',
        extPowerRating: '2',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '1',
        setName: 'Sample',
        threshold: 'F',
        subtype: ''
      },
      // Sample Artifacts
      {
        productId: 'sample_artifact_1',
        name: 'Crystal Orb',
        cleanName: 'crystal_orb',
        type: CardType.Artifact,
        mana_cost: 2,
        cost: 2,
        elements: [Element.Water],
        text: 'Tap: Scry 1.',
        power: 0,
        rarity: CardRarity.Common,
        baseName: 'Crystal Orb',
        imageUrl: '',
        categoryId: 'artifact',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Common',
        extDescription: 'Tap: Scry 1.',
        extCost: '2',
        extThreshold: 'W',
        extElement: 'Water',
        extTypeLine: 'Artifact',
        extCardCategory: 'Artifact',
        extCardType: 'Artifact',
        subTypeName: '',
        extPowerRating: '',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '',
        setName: 'Sample',
        threshold: 'W',
        subtype: ''
      },
      // Sample Auras
      {
        productId: 'sample_aura_1',
        name: 'Blessing of Strength',
        cleanName: 'blessing_of_strength',
        type: CardType.Aura,
        mana_cost: 1,
        cost: 1,
        elements: [Element.Fire],
        text: 'Enchanted creature gets +2/+1.',
        power: 0,
        rarity: CardRarity.Common,
        baseName: 'Blessing of Strength',
        imageUrl: '',
        categoryId: 'aura',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Common',
        extDescription: 'Enchanted creature gets +2/+1.',
        extCost: '1',
        extThreshold: 'F',
        extElement: 'Fire',
        extTypeLine: 'Aura',
        extCardCategory: 'Aura',
        extCardType: 'Aura',
        subTypeName: '',
        extPowerRating: '',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '',
        setName: 'Sample',
        threshold: 'F',
        subtype: ''
      },
      // Sample Magics
      {
        productId: 'sample_magic_1',
        name: 'Lightning Bolt',
        cleanName: 'lightning_bolt',
        type: CardType.Magic,
        mana_cost: 1,
        cost: 1,
        elements: [Element.Fire],
        text: 'Deal 3 damage to any target.',
        power: 0,
        rarity: CardRarity.Common,
        baseName: 'Lightning Bolt',
        imageUrl: '',
        categoryId: 'magic',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Common',
        extDescription: 'Deal 3 damage to any target.',
        extCost: '1',
        extThreshold: 'F',
        extElement: 'Fire',
        extTypeLine: 'Magic',
        extCardCategory: 'Magic',
        extCardType: 'Magic',
        subTypeName: '',
        extPowerRating: '',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '',
        setName: 'Sample',
        threshold: 'F',
        subtype: ''
      },
      {
        productId: 'sample_magic_2',
        name: 'Healing Wave',
        cleanName: 'healing_wave',
        type: CardType.Magic,
        mana_cost: 2,
        cost: 2,
        elements: [Element.Water],
        text: 'Restore 3 health to any target.',
        power: 0,
        rarity: CardRarity.Common,
        baseName: 'Healing Wave',
        imageUrl: '',
        categoryId: 'magic',
        groupId: 'sample',
        url: '',
        modifiedOn: '',
        imageCount: '1',
        extRarity: 'Common',
        extDescription: 'Restore 3 health to any target.',
        extCost: '2',
        extThreshold: 'W',
        extElement: 'Water',
        extTypeLine: 'Magic',
        extCardCategory: 'Magic',
        extCardType: 'Magic',
        subTypeName: '',
        extPowerRating: '',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '',
        setName: 'Sample',
        threshold: 'W',
        subtype: ''
      }
    ];

    // Categorize the cards
    const avatars = sampleCards.filter(card => card.type === CardType.Avatar);
    const sites = sampleCards.filter(card => card.type === CardType.Site);
    const minions = sampleCards.filter(card => card.type === CardType.Minion);
    const artifacts = sampleCards.filter(card => card.type === CardType.Artifact);
    const auras = sampleCards.filter(card => card.type === CardType.Aura);
    const magics = sampleCards.filter(card => card.type === CardType.Magic);

    return {
      uniqueCards: sampleCards,
      avatars,
      sites,
      minions,
      artifacts,
      auras,
      magics
    };
  }
}

// Export for browser use
export default BrowserDeckBuilder;
