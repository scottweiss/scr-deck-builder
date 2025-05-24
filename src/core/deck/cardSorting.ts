import { Card } from '../../types/Card';

/**
 * Helper function to identify combo cards
 */
export function isComboCard(card: Card, comboPieces: Set<string>): boolean {
  return comboPieces.has(card.baseName);
}

/**
 * Sort cards by combo priority and synergy
 */
export function sortCardsByComboAndSynergy(
  cards: Card[],
  selectedSpells: Card[],
  comboPieces: Set<string>,
  calculateSynergy: (card: Card, deck: Card[]) => number
): Card[] {
  return [...cards]
    .filter((card: Card) => !selectedSpells.some((s: Card) => s.baseName === card.baseName))
    .sort((a: Card, b: Card) => {
      // Prioritize combo pieces
      const aIsCombo = isComboCard(a, comboPieces);
      const bIsCombo = isComboCard(b, comboPieces);
      
      if (aIsCombo !== bIsCombo) {
        return bIsCombo ? 1 : -1;
      }
      
      // Then by synergy
      return calculateSynergy(b, selectedSpells) - calculateSynergy(a, selectedSpells);
    });
}

/**
 * Sort minions by combo priority and synergy
 */
export function sortMinions(
  minions: Card[],
  selectedSpells: Card[],
  comboPieces: Set<string>,
  calculateSynergy: (card: Card, deck: Card[]) => number
): Card[] {
  return sortCardsByComboAndSynergy(minions, selectedSpells, comboPieces, calculateSynergy);
}

/**
 * Sort auras by combo priority and synergy
 */
export function sortAuras(
  auras: Card[],
  selectedSpells: Card[],
  comboPieces: Set<string>,
  calculateSynergy: (card: Card, deck: Card[]) => number
): Card[] {
  return sortCardsByComboAndSynergy(auras, selectedSpells, comboPieces, calculateSynergy);
}

/**
 * Sort magic spells by combo priority and synergy
 */
export function sortMagics(
  magics: Card[],
  selectedSpells: Card[],
  comboPieces: Set<string>,
  calculateSynergy: (card: Card, deck: Card[]) => number
): Card[] {
  return sortCardsByComboAndSynergy(magics, selectedSpells, comboPieces, calculateSynergy);
}
