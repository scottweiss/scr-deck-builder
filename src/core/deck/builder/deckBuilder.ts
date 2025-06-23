import { Card, CardType, Element, Avatar, Site } from '../../../types';
import { Deck } from '../../../types/Deck';
import { DeckValidator } from '../analysis/deckValidator';

export interface DeckBuildOptions {
  avatar?: Avatar;
  preferredElements?: Element[];
  archetype?: string;
  maxCards?: number;
  sites: Site[];
  spellbook: Card[];
}

export class DeckBuilder {
  private deck: Partial<Deck> = {
    name: 'New Deck',
    sites: [],
    spellbook: []
  };

  static create(): DeckBuilder {
    return new DeckBuilder();
  }

  withName(name: string): DeckBuilder {
    this.deck.name = name;
    return this;
  }

  withAvatar(avatar: Avatar): DeckBuilder {
    this.deck.avatar = avatar;
    return this;
  }

  addSite(site: Site): DeckBuilder {
    if (!this.deck.sites) this.deck.sites = [];
    this.deck.sites.push(site);
    return this;
  }

  addSites(sites: Site[]): DeckBuilder {
    if (!this.deck.sites) this.deck.sites = [];
    this.deck.sites.push(...sites);
    return this;
  }

  addSpell(card: Card): DeckBuilder {
    if (!this.deck.spellbook) this.deck.spellbook = [];
    this.deck.spellbook.push(card);
    return this;
  }

  addSpells(cards: Card[]): DeckBuilder {
    if (!this.deck.spellbook) this.deck.spellbook = [];
    this.deck.spellbook.push(...cards);
    return this;
  }

  build(): Deck {
    if (!this.deck.avatar) {
      throw new Error('Deck must have an avatar');
    }

    const deck: Deck = {
      name: this.deck.name || 'New Deck',
      avatar: this.deck.avatar,
      sites: this.deck.sites || [],
      spellbook: this.deck.spellbook || []
    };

    const validation = DeckValidator.validate(deck);
    if (!validation.isValid) {
      console.warn('Deck validation failed:', validation.errors);
    }

    return deck;
  }

  static buildOptimizedDeck(options: {
    availableCards: Card[];
    avatar: Avatar;
    preferredElements?: Element[];
    archetype?: string;
  }): Deck {
    const builder = new DeckBuilder();
    builder.withAvatar(options.avatar);

    // Filter cards by type
    const sites = options.availableCards.filter(card => card.type === CardType.Site) as Site[];
    const spells = options.availableCards.filter(card => 
      card.type !== CardType.Site && card.type !== CardType.Avatar
    );

    // Build sites deck (30 cards)
    const selectedSites = this.selectSites(sites, options.avatar.elements, 30);
    builder.addSites(selectedSites);

    // Build spellbook (50 cards)
    const selectedSpells = this.selectSpells(spells, options.avatar.elements, options.archetype, 50);
    builder.addSpells(selectedSpells);

    return builder.build();
  }

  private static selectSites(availableSites: Site[], avatarElements: Element[], count: number): Site[] {
    const sites: Site[] = [];
    const maxCopies = 4;

    // Prioritize sites matching avatar elements
    const matchingSites = availableSites.filter(site =>
      site.elements.some(element => avatarElements.includes(element))
    );
    const otherSites = availableSites.filter(site =>
      !site.elements.some(element => avatarElements.includes(element))
    );

    // Add matching sites first
    for (const site of matchingSites) {
      const copies = Math.min(maxCopies, count - sites.length);
      for (let i = 0; i < copies && sites.length < count; i++) {
        sites.push(site);
      }
    }

    // Fill with other sites if needed
    for (const site of otherSites) {
      const currentCount = sites.filter(s => s.name === site.name).length;
      const copies = Math.min(maxCopies - currentCount, count - sites.length);
      for (let i = 0; i < copies && sites.length < count; i++) {
        sites.push(site);
      }
    }

    return sites.slice(0, count);
  }

  private static selectSpells(
    availableSpells: Card[],
    avatarElements: Element[],
    archetype: string | undefined,
    count: number
  ): Card[] {
    const spells: Card[] = [];
    const targetCurve = this.getTargetManaCurve(archetype);
    
    // Group spells by mana cost
    const spellsByCost: { [cost: number]: Card[] } = {};
    availableSpells.forEach(spell => {
      const cost = Math.min(spell.mana_cost || 0, 7);
      if (!spellsByCost[cost]) spellsByCost[cost] = [];
      spellsByCost[cost].push(spell);
    });

    // Sort spells within each cost by element match
    Object.values(spellsByCost).forEach(costGroup => {
      costGroup.sort((a, b) => {
        const aMatch = a.elements.some(e => avatarElements.includes(e)) ? 1 : 0;
        const bMatch = b.elements.some(e => avatarElements.includes(e)) ? 1 : 0;
        return bMatch - aMatch;
      });
    });

    // Build deck following target curve
    for (const [costStr, targetCount] of Object.entries(targetCurve)) {
      const cost = parseInt(costStr);
      const availableAtCost = spellsByCost[cost] || [];
      let addedAtCost = 0;

      for (const spell of availableAtCost) {
        if (addedAtCost >= targetCount || spells.length >= count) break;
        
        const currentCopies = spells.filter(s => s.name === spell.name).length;
        const maxCopies = spell.rarity === 'Unique' ? 1 : 4;
        
        if (currentCopies < maxCopies) {
          spells.push(spell);
          addedAtCost++;
        }
      }
    }

    // Fill remaining slots
    while (spells.length < count) {
      for (const spell of availableSpells) {
        if (spells.length >= count) break;
        
        const currentCopies = spells.filter(s => s.name === spell.name).length;
        const maxCopies = spell.rarity === 'Unique' ? 1 : 4;
        
        if (currentCopies < maxCopies) {
          spells.push(spell);
        }
      }
      break; // Prevent infinite loop
    }

    return spells.slice(0, count);
  }

  private static getTargetManaCurve(archetype?: string): { [cost: number]: number } {
    switch (archetype?.toLowerCase()) {
      case 'aggro':
        return { 1: 12, 2: 14, 3: 10, 4: 8, 5: 4, 6: 2, 7: 0 };
      case 'control':
        return { 1: 6, 2: 8, 3: 8, 4: 10, 5: 8, 6: 6, 7: 4 };
      case 'combo':
        return { 1: 8, 2: 10, 3: 12, 4: 10, 5: 6, 6: 3, 7: 1 };
      default: // midrange
        return { 1: 8, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2 };
    }
  }
}
