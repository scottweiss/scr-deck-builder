import { Deck, DeckValidation } from '../../../types';
import { Card, CardRarity } from '../../../types/Card';

/**
 * Validates a complete deck according to official Sorcery: Contested Realm rules
 */
export class DeckValidator {
  private static readonly SITE_COUNT = 30;
  private static readonly SPELLBOOK_COUNT = 50;
  private static readonly MAX_COPIES_ORDINARY = 4;
  private static readonly MAX_COPIES_UNIQUE = 1;

  /**
   * Validates an entire deck against all game rules
   */
  static validate(
    deck: Deck
  ): DeckValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate avatar
    if (!deck.avatar) {
      errors.push('Deck must have an avatar');
    }

    // Validate site count
    if (deck.sites.length !== this.SITE_COUNT) {
      errors.push(`Deck must have exactly ${this.SITE_COUNT} sites (has ${deck.sites.length})`);
    }

    // Validate spellbook count
    if (deck.spellbook.length !== this.SPELLBOOK_COUNT) {
      errors.push(`Spellbook must have exactly ${this.SPELLBOOK_COUNT} cards (has ${deck.spellbook.length})`);
    }

    // Validate card copies
    const cardCounts = this.countCards([...deck.sites, ...deck.spellbook]);
    for (const [cardName, count] of Object.entries(cardCounts)) {
      const card = [...deck.sites, ...deck.spellbook].find(c => c.name === cardName);
      if (card) {
        const maxCopies = card.rarity === CardRarity.Unique ? this.MAX_COPIES_UNIQUE : this.MAX_COPIES_ORDINARY;
        if (count > maxCopies) {
          errors.push(`Too many copies of "${cardName}": ${count} (max: ${maxCopies})`);
        }
      }
    }

    // Check mana curve
    const manaCurve = this.calculateManaCurve(deck.spellbook);
    const lowCostCards = (manaCurve[1] || 0) + (manaCurve[2] || 0);
    if (lowCostCards < 10) {
      warnings.push('Deck has few low-cost cards, may have slow starts');
    }

    // Check element consistency
    const avatarElements = deck.avatar?.elements || [];
    const elementMatch = this.checkElementConsistency(deck, avatarElements);
    if (elementMatch < 0.5) {
      warnings.push('Many cards don\'t match avatar\'s elements');
    }

    // Generate suggestions
    if (Object.keys(manaCurve).length < 4) {
      suggestions.push('Consider diversifying your mana curve');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private static countCards(cards: Card[]): { [cardName: string]: number } {
    const counts: { [cardName: string]: number } = {};
    cards.forEach(card => {
      counts[card.name] = (counts[card.name] || 0) + 1;
    });
    return counts;
  }

  private static calculateManaCurve(cards: Card[]): { [cost: number]: number } {
    const curve: { [cost: number]: number } = {};
    cards.forEach(card => {
      const cost = Math.min(card.mana_cost || 0, 7);
      curve[cost] = (curve[cost] || 0) + 1;
    });
    return curve;
  }

  private static checkElementConsistency(deck: Deck, avatarElements: string[]): number {
    if (avatarElements.length === 0) return 1;
    
    const matchingCards = deck.spellbook.filter(card =>
      card.elements.some(element => avatarElements.includes(element))
    );
    
    return matchingCards.length / deck.spellbook.length;
  }
}
