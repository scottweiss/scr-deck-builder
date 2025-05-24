import { Card } from '../../../types/Card';

export interface CardSelectionResult {
  updatedDeck: Card[];
  addedCount: number;
}

/**
 * Add cards from a sorted list up to the target allocation
 */
export function addCardsFromSortedList(
  sortedCards: Card[],
  selectedSpells: Card[],
  targetCount: number,
  copiesInDeck: Record<string, number>,
  addCardWithCopies: (card: Card, deck: Card[], remaining: number, copies: Record<string, number>, avatar?: any) => Card[],
  avatar?: any
): CardSelectionResult {
  let updatedDeck = [...selectedSpells];
  let addedCount = 0;

  for (const card of sortedCards) {
    const remaining = targetCount - addedCount;
    if (remaining <= 0) break;

    const before = updatedDeck.length;
    updatedDeck = addCardWithCopies(card, updatedDeck, remaining, copiesInDeck, avatar);
    addedCount += (updatedDeck.length - before);
  }

  return {
    updatedDeck,
    addedCount
  };
}

/**
 * Select minions for the deck
 */
export function selectMinions(
  sortedMinions: Card[],
  selectedSpells: Card[],
  allocation: number,
  copiesInDeck: Record<string, number>,
  addCardWithCopies: (card: Card, deck: Card[], remaining: number, copies: Record<string, number>, avatar?: any) => Card[],
  avatar?: any
): CardSelectionResult {
  console.log(`Selecting ${allocation} minions...`);
  return addCardsFromSortedList(
    sortedMinions,
    selectedSpells,
    allocation,
    copiesInDeck,
    addCardWithCopies,
    avatar
  );
}

/**
 * Select auras for the deck
 */
export function selectAuras(
  sortedAuras: Card[],
  selectedSpells: Card[],
  allocation: number,
  copiesInDeck: Record<string, number>,
  addCardWithCopies: (card: Card, deck: Card[], remaining: number, copies: Record<string, number>, avatar?: any) => Card[],
  avatar?: any
): CardSelectionResult {
  console.log(`Selecting ${allocation} auras...`);
  return addCardsFromSortedList(
    sortedAuras,
    selectedSpells,
    allocation,
    copiesInDeck,
    addCardWithCopies,
    avatar
  );
}

/**
 * Select magic spells for the deck
 */
export function selectMagics(
  sortedMagics: Card[],
  selectedSpells: Card[],
  allocation: number,
  copiesInDeck: Record<string, number>,
  addCardWithCopies: (card: Card, deck: Card[], remaining: number, copies: Record<string, number>, avatar?: any) => Card[],
  avatar?: any
): CardSelectionResult {
  console.log(`Selecting ${allocation} magic spells...`);
  return addCardsFromSortedList(
    sortedMagics,
    selectedSpells,
    allocation,
    copiesInDeck,
    addCardWithCopies,
    avatar
  );
}
