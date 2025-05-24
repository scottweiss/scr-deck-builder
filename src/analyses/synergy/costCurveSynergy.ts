import { Card } from '../../types/Card';

/**
 * Calculate cost curve synergy between a card and the current deck
 */
export function calculateCostCurveSynergy(card: Card, deck: Card[]): number {
    const cardCost = card.mana_cost;
    let synergy = 0;
    
    // Count cards at each cost
    const costCounts: Record<number, number> = {};
    for (const deckCard of deck) {
        const cost = deckCard.mana_cost;
        costCounts[cost] = (costCounts[cost] || 0) + 1;
    }
    
    // Penalize overloaded costs, reward underrepresented costs
    const currentCount = costCounts[cardCost] || 0;
    const desiredCount = Math.max(6 - cardCost, 2); // Higher costs should have fewer cards
    
    if (currentCount < desiredCount) {
        synergy += 2; // Reward filling gaps in curve
    } else if (currentCount > desiredCount * 1.5) {
        synergy -= 1; // Penalize overloaded costs
    }
    
    return synergy;
}
