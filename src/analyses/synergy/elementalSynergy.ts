import { Card } from '../../types/Card';

/**
 * Calculate elemental synergy between a card and the current deck
 */
export function calculateElementalSynergy(card: Card, deck: Card[]): number {
    const cardElements = card.elements || [];
    let synergy = 0;
    
    // Count elements in deck
    const elementCounts: Record<string, number> = {};
    for (const deckCard of deck) {
        const elements = deckCard.elements || [];
        for (const element of elements) {
            elementCounts[element] = (elementCounts[element] || 0) + 1;
        }
    }
    
    // Calculate synergy based on shared elements
    for (const element of cardElements) {
        const count = elementCounts[element] || 0;
        synergy += Math.min(count, 5); // Cap element synergy at 5 per element
    }
    
    return synergy;
}
