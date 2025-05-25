/**
 * Optimized Consolidated Sorcery Trading Card Game Data
 * 
 * This file contains the combined data from BetaProductsAndPrices.csv and ArthurianLegendsProductsAndPrices.csv
 * Pre-filtered to exclude foil cards, booster products, and preconstructed decks
 * 
 * Features:
 * - Lazy loading mechanism to reduce initial load time
 * - Memoization of frequently accessed card attributes
 * - Compressed card data format
 * 
 * Statistics:
 * - Beta cards: 402
 * - Arthurian Legends cards: 220
 * - Total cards: 622
 * - Foils filtered: 632
 * - Boosters filtered: 15
 */

import { RawCard, Card, CardSet } from '../../types/Card';
import { SYSTEM_MODE } from '../../config';
import * as utils from '../../utils/utils';

// Compressed card data structure to reduce file size
// Each card is stored as an array with a consistent index map
const CARD_KEYS: string[] = [
  "productId", "name", "cleanName", "imageUrl", "categoryId", 
  "groupId", "url", "modifiedOn", "imageCount", "extRarity", 
  "extDescription", "extCost", "extThreshold", "extElement", "extCardType",
  "subTypeName", "setName"
];

// Import the cards only when needed (lazy loading)
let _loadedCards: RawCard[] | null = null;

// Memoized card attribute processing
const _memoizedAttributes = new Map<string, any>();

/**
 * Load the compressed card data
 * @returns {Array} Uncompressed card objects
 */
async function loadCards(): Promise<RawCard[]> {
  if (_loadedCards) {
    return _loadedCards;
  }
  
  console.log("Loading Sorcery card data...");
  const start = performance.now();
  
  try {
    // Load the compressed card data from the generated JavaScript file
    const compressedData = await import('./sorceryCards.compressed');
    
    // Decompress the card data into full objects
    _loadedCards = compressedData.cards.map((cardArray: any[]) => {
      const card: any = {};
      compressedData.keys.forEach((key: string, index: number) => {
        card[key] = cardArray[index];
      });
      return card as RawCard;
    });
  } catch (error) {
    console.error("Failed to load compressed card data:", error);
    _loadedCards = [];
  }
  
  const end = performance.now();
  console.log(`Loaded ${_loadedCards?.length || 0} cards in ${(end - start).toFixed(2)}ms`);
  
  return _loadedCards || [];
}

/**
 * Get the total number of cards without loading them all
 * Uses metadata from the compressed format
 */
export async function getCardCount(): Promise<number> {
  try {
    const compressedData = await import('./sorceryCards.compressed');
    return compressedData.cards.length;
  } catch (error) {
    console.error("Failed to get card count:", error);
    return 0;
  }
}

/**
 * Get Beta cards only
 */
export async function getBetaCards(): Promise<Card[]> {
  const rawCards = await getCardsBySet('Beta');
  return rawCards.map(rawCard => utils.transformRawCardToCard(rawCard));
}

/**
 * Get Arthurian Legends cards only
 */
export async function getArthurianCards(): Promise<Card[]> {
  const rawCards = await getCardsBySet('ArthurianLegends');
  return rawCards.map(rawCard => utils.transformRawCardToCard(rawCard));
}

/**
 * Get cards by set name with lazy loading
 */
export async function getCardsBySet(setName: CardSet): Promise<RawCard[]> {
  const memoKey = `set_${setName}`;
  
  if (_memoizedAttributes.has(memoKey)) {
    return _memoizedAttributes.get(memoKey);
  }
  
  const allCards = await loadCards();
  const setCards = allCards.filter((card: RawCard) => card.setName === setName);
  
  _memoizedAttributes.set(memoKey, setCards);
  return setCards;
}

/**
 * Get all cards (triggers full loading)
 */
export async function getAllCards(): Promise<Card[]> {
  const rawCards = await loadCards();
  if (SYSTEM_MODE.DEBUG) {
    console.log(`DEBUG: About to transform ${rawCards.length} raw cards`);
    console.log(`DEBUG: First raw card type: ${rawCards[0]?.extCardType}, element: ${rawCards[0]?.extElement}`);
    console.log(`DEBUG: Utils transformRawCardToCard type: ${typeof utils.transformRawCardToCard}`);
  }
  
  const transformed = rawCards.map(rawCard => {
    const result = utils.transformRawCardToCard(rawCard);
    return result;
  });
  
  if (SYSTEM_MODE.DEBUG) {
    console.log(`DEBUG: First transformed card type: ${transformed[0]?.type}, elements: ${JSON.stringify(transformed[0]?.elements)}`);
  }
  return transformed;
}

/**
 * Search cards by name with fuzzy matching
 */
export async function searchCardsByName(query: string): Promise<Card[]> {
  const memoKey = `search_${query.toLowerCase()}`;
  
  if (_memoizedAttributes.has(memoKey)) {
    const rawCards = _memoizedAttributes.get(memoKey);
    return rawCards.map((rawCard: RawCard) => utils.transformRawCardToCard(rawCard));
  }
  
  const allCards = await loadCards();
  const lowerQuery = query.toLowerCase();
  
  const results = allCards.filter((card: RawCard) => 
    card.name.toLowerCase().includes(lowerQuery) ||
    card.cleanName.toLowerCase().includes(lowerQuery)
  );
  
  _memoizedAttributes.set(memoKey, results);
  return results.map((rawCard: RawCard) => utils.transformRawCardToCard(rawCard));
}

/**
 * Get cards by type with memoization
 */
export async function getCardsByType(cardType: string): Promise<Card[]> {
  const memoKey = `type_${cardType}`;
  if (_memoizedAttributes.has(memoKey)) {
    const rawCards = _memoizedAttributes.get(memoKey);
    return rawCards.map((rawCard: RawCard) => utils.transformRawCardToCard(rawCard));
  }
  const allCards = await loadCards();
  const typeCards = allCards.filter((card: RawCard) => card.extCardType === cardType);
  _memoizedAttributes.set(memoKey, typeCards);
  return typeCards.map((rawCard: RawCard) => utils.transformRawCardToCard(rawCard));
}

/**
 * Get cards by rarity with memoization
 */
export async function getCardsByRarity(rarity: string): Promise<Card[]> {
  const memoKey = `rarity_${rarity}`;
  if (_memoizedAttributes.has(memoKey)) {
    const rawCards = _memoizedAttributes.get(memoKey);
    return rawCards.map((rawCard: RawCard) => utils.transformRawCardToCard(rawCard));
  }
  const allCards = await loadCards();
  const rarityCards = allCards.filter((card: RawCard) => card.extRarity === rarity);
  _memoizedAttributes.set(memoKey, rarityCards);
  return rarityCards.map((rawCard: RawCard) => utils.transformRawCardToCard(rawCard));
}

/**
 * Get cards by element with memoization
 */
export async function getCardsByElement(element: string): Promise<Card[]> {
  const memoKey = `element_${element}`;
  if (_memoizedAttributes.has(memoKey)) {
    const rawCards = _memoizedAttributes.get(memoKey);
    return rawCards.map((rawCard: RawCard) => utils.transformRawCardToCard(rawCard));
  }
  const allCards = await loadCards();
  const elementCards = allCards.filter((card: RawCard) => card.extElement === element);
  _memoizedAttributes.set(memoKey, elementCards);
  return elementCards.map((rawCard: RawCard) => utils.transformRawCardToCard(rawCard));
}

/**
 * Get memory usage statistics
 */
export function getMemoryStats(): { loadedCards: number; memoizedQueries: number } {
  return {
    loadedCards: _loadedCards ? _loadedCards.length : 0,
    memoizedQueries: _memoizedAttributes.size
  };
}

/**
 * Clear memory cache (useful for memory management)
 */
export function clearCache(): void {
  _loadedCards = null;
  _memoizedAttributes.clear();
  console.log("Card cache cleared");
}
