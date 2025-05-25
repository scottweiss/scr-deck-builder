import BrowserDeckBuilder from './unified-deck-builder';

/**
 * Browser-specific entry point that handles data loading
 */
export class SorceryDeckBuilder extends BrowserDeckBuilder {
  constructor() {
    super();
  }

  /**
   * Override the initialize method to handle browser-specific data loading
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Loading Sorcery card data for browser...');
    
    try {
      // In browser, we'll use the compressed card data or fetch from API
      const cardData = await this.loadBrowserCardData();
      this.cardData = cardData;
      this.isInitialized = true;
      console.log(`Loaded ${cardData.uniqueCards.length} cards`);
    } catch (error) {
      console.error('Failed to load card data:', error);
      // Fallback to sample data
      this.cardData = this.getSampleCardData();
      this.isInitialized = true;
      console.log('Using sample card data as fallback');
    }
  }

  private async loadBrowserCardData(): Promise<any> {
    // Check if compressed card data is available globally
    if (typeof window !== 'undefined' && (window as any).COMPRESSED_CARD_DATA) {
      return this.processCompressedData((window as any).COMPRESSED_CARD_DATA);
    }

    // Try to fetch from API
    try {
      const response = await fetch('/api/cards');
      if (response.ok) {
        const data = await response.json();
        return this.processApiData(data);
      }
    } catch (error) {
      console.warn('Failed to fetch cards from API:', error);
    }

    // Fallback to processing the compressed data if it exists
    if (typeof window !== 'undefined' && (window as any).loadCompressedData) {
      const compressed = (window as any).loadCompressedData();
      return this.processCompressedData(compressed);
    }

    throw new Error('No card data source available');
  }

  private processCompressedData(compressed: any): any {
    // Decompress and transform card data
    const rawCards = compressed.cards.map((cardArray: any[]) => 
      this.decompressCard(cardArray, compressed.keys)
    );

    // Transform cards to expected format
    const transformedCards = rawCards.map((card: any) => this.transformCard(card));

    // Categorize cards
    const uniqueCards = transformedCards;
    const avatars = transformedCards.filter((card: any) => card.type === 'Avatar');
    const sites = transformedCards.filter((card: any) => card.type === 'Site');
    const minions = transformedCards.filter((card: any) => card.type === 'Minion');
    const artifacts = transformedCards.filter((card: any) => card.type === 'Artifact');
    const auras = transformedCards.filter((card: any) => card.type === 'Aura');
    const magics = transformedCards.filter((card: any) => card.type === 'Magic');

    return {
      uniqueCards,
      avatars,
      sites,
      minions,
      artifacts,
      auras,
      magics,
      keywords: this.extractKeywords(transformedCards),
      elements: ['Water', 'Fire', 'Earth', 'Air', 'Void']
    };
  }

  private processApiData(data: any): any {
    // Process API response
    return {
      uniqueCards: data.cards || [],
      avatars: data.avatars || [],
      sites: data.sites || [],
      minions: data.minions || [],
      artifacts: data.artifacts || [],
      auras: data.auras || [],
      magics: data.magics || [],
      keywords: data.keywords || [],
      elements: data.elements || ['Water', 'Fire', 'Earth', 'Air', 'Void']
    };
  }

  private decompressCard(cardArray: any[], keys: string[]): any {
    const card: any = {};
    keys.forEach((key, index) => {
      if (cardArray[index] !== undefined && cardArray[index] !== null) {
        card[key] = cardArray[index];
      }
    });
    return card;
  }

  private transformCard(rawCard: any): any {
    return {
      name: rawCard.name || '',
      type: rawCard.type || '',
      elements: this.parseElements(rawCard.elements || rawCard.element || ''),
      mana_cost: parseInt(rawCard.mana_cost || rawCard.cost || '0'),
      attack: parseInt(rawCard.attack || '0'),
      defense: parseInt(rawCard.defense || rawCard.life || '0'),
      rule_text: rawCard.rule_text || rawCard.text || '',
      rarity: rawCard.rarity || '',
      set: rawCard.set || '',
      threshold: this.parseThreshold(rawCard.threshold || ''),
      archetype: this.determineArchetype(rawCard)
    };
  }

  private parseElements(elementStr: string): string[] {
    if (!elementStr) return [];
    
    const elementMap: Record<string, string> = {
      'W': 'Water',
      'F': 'Fire', 
      'E': 'Earth',
      'A': 'Air',
      'V': 'Void'
    };

    if (elementStr.length <= 2) {
      // Single character format like "W" or "WF"
      return elementStr.split('').map(char => elementMap[char]).filter(Boolean);
    } else {
      // Full name format
      return elementStr.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  private parseThreshold(thresholdStr: string): Record<string, number> {
    const threshold: Record<string, number> = {};
    if (!thresholdStr) return threshold;

    const elementMap: Record<string, string> = {
      'W': 'Water',
      'F': 'Fire', 
      'E': 'Earth',
      'A': 'Air',
      'V': 'Void'
    };

    // Parse threshold like "WW" or "FF"
    for (const char of thresholdStr) {
      const element = elementMap[char];
      if (element) {
        threshold[element] = (threshold[element] || 0) + 1;
      }
    }

    return threshold;
  }

  private determineArchetype(card: any): string[] {
    const archetypes: string[] = [];
    
    if (card.archetype) {
      return Array.isArray(card.archetype) ? card.archetype : [card.archetype];
    }

    // Determine archetype based on card properties
    const cost = parseInt(card.mana_cost || card.cost || '0');
    const attack = parseInt(card.attack || '0');
    const ruleText = (card.rule_text || card.text || '').toLowerCase();

    if (cost <= 3 && attack >= 2) {
      archetypes.push('Aggro');
    }
    
    if (ruleText.includes('draw') || ruleText.includes('counter')) {
      archetypes.push('Control');
    }
    
    if (cost >= 4 && cost <= 6) {
      archetypes.push('Midrange');
    }

    if (ruleText.includes('combo') || ruleText.includes('synergy')) {
      archetypes.push('Combo');
    }

    return archetypes.length > 0 ? archetypes : ['Midrange'];
  }

  private extractKeywords(cards: any[]): string[] {
    const keywords = new Set<string>();
    
    cards.forEach(card => {
      const ruleText = card.rule_text || '';
      // Extract common keywords
      const commonKeywords = ['Haste', 'Flying', 'Defender', 'Trample', 'Intimidate', 'Lifelink'];
      commonKeywords.forEach(keyword => {
        if (ruleText.includes(keyword)) {
          keywords.add(keyword);
        }
      });
    });

    return Array.from(keywords);
  }

  getSampleCardData(): any {
    // Fallback sample data for development/testing
    const sampleCards = [
      {
        name: "Sample Avatar",
        type: "Avatar",
        elements: ["Water"],
        mana_cost: 0,
        rule_text: "Sample avatar for testing",
        archetype: ["Control"]
      },
      {
        name: "Sample Site",
        type: "Site",
        elements: ["Water"],
        mana_cost: 0,
        rule_text: "Tap: Add Water to your mana pool",
        archetype: []
      },
      {
        name: "Sample Minion",
        type: "Minion",
        elements: ["Water"],
        mana_cost: 3,
        attack: 2,
        defense: 3,
        rule_text: "Sample minion for testing",
        archetype: ["Midrange"]
      }
    ];

    return {
      uniqueCards: sampleCards,
      avatars: sampleCards.filter(card => card.type === 'Avatar'),
      sites: sampleCards.filter(card => card.type === 'Site'),
      minions: sampleCards.filter(card => card.type === 'Minion'),
      artifacts: [],
      auras: [],
      magics: [],
      keywords: ['Haste', 'Flying'],
      elements: ['Water', 'Fire', 'Earth', 'Air', 'Void']
    };
  }
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
  (window as any).SorceryDeckBuilder = SorceryDeckBuilder;
}

export default SorceryDeckBuilder;
