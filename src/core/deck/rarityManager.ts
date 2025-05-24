import { Card } from '../../types/Card';
import { canIncludeWithAvatar } from '../cards/cardAnalysis';

/**
 * Interface for tracking card copies in deck
 */
export interface CopiesInDeck {
    [baseName: string]: number;
}

/**
 * Get maximum allowed copies for a card based on its rarity
 * @param rarity The rarity string
 * @returns Maximum number of copies allowed
 */
export function getMaxCopiesForRarity(rarity: string | undefined): number {
    const rarityLower = (rarity || "").toLowerCase();
    if (rarityLower.includes("unique")) return 1;
    if (rarityLower.includes("elite")) return 2;
    if (rarityLower.includes("exceptional")) return 3;
    return 4; // Default for ordinary cards
}

/**
 * Add cards to deck with copy restrictions
 * @param card Card to add
 * @param deck Current deck
 * @param maxCardsToAdd Maximum number of this card to add
 * @param copiesInDeck Current copy tracking
 * @param selectedAvatar Avatar for compatibility checking
 * @returns Updated deck
 */
export function addCardWithCopies(
    card: Card | null,
    deck: Card[],
    maxCardsToAdd: number,
    copiesInDeck: CopiesInDeck,
    selectedAvatar: Card | null
): Card[] {
    if (!card || deck.length >= 50) return deck;

    // Check avatar restrictions
    if (!canIncludeWithAvatar(card, selectedAvatar)) {
        return deck; // Skip this card if it doesn't work with our avatar
    }

    const baseName = card.baseName || card.name || '';
    const rarity = card.rarity;

    // Initialize counter if this is the first time seeing this card
    if (!copiesInDeck[baseName]) {
        copiesInDeck[baseName] = 0;
    }

    // Determine maximum allowed copies based on rarity
    const maxCopies = getMaxCopiesForRarity(rarity);

    // Add up to the allowed number of copies
    const copiesToAdd = Math.min(
        maxCopies - copiesInDeck[baseName], // How many more can we add based on rarity
        maxCardsToAdd, // How many we want to add
        50 - deck.length // How many we can add before hitting 50 cards
    );

    for (let i = 0; i < copiesToAdd; i++) {
        // Add a copy of the card (using a clone to avoid reference issues)
        deck.push({ ...card });
        copiesInDeck[baseName]++;
    }

    return deck;
}

/**
 * Enforce rarity limits on a collection of cards
 * @param cards Cards to filter
 * @returns Filtered cards respecting rarity limits
 */
export function enforceRarityLimits(cards: Card[]): Card[] {
    const result: Card[] = [];
    const countByName: Record<string, number> = {};

    for (const card of cards) {
        const baseName = card.baseName || card.name || '';
        const rarity = card.rarity;

        // Initialize counter if this is the first time seeing this card
        if (!countByName[baseName]) {
            countByName[baseName] = 0;
        }

        // Determine maximum allowed copies based on rarity
        const maxCopies = getMaxCopiesForRarity(rarity);

        // Add card if we haven't hit the limit
        if (countByName[baseName] < maxCopies) {
            result.push(card);
            countByName[baseName]++;
        }
    }

    return result;
}
