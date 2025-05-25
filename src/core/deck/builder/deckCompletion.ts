import { Card } from '../../../types/Card';

export interface DeckCompletionOptions {
    selectedSpells: Card[];
    allAvailableCards: Card[];
    targetDeckSize: number;
    copiesInDeck: Record<string, number>;
    calculateSynergy: (card: Card, deck: Card[]) => number;
}

export interface DeckCompletionResult {
    completedDeck: Card[];
    copiesInDeck: Record<string, number>;
    addedCards: Card[];
}

/**
 * Fill remaining deck slots with high-synergy cards
 */
export function completeDeckWithSynergyCards(options: DeckCompletionOptions): DeckCompletionResult {
    const { selectedSpells, allAvailableCards, targetDeckSize, copiesInDeck, calculateSynergy } = options;
    
    const remainingSlots = Math.max(0, targetDeckSize - selectedSpells.length);
    const addedCards: Card[] = [];
    let currentDeck = [...selectedSpells];
    let currentCopies = { ...copiesInDeck };
    
    if (remainingSlots > 0) {
        console.log(`Filling ${remainingSlots} remaining slots with high-synergy cards...`);
        
        // Get all available cards not yet in deck
        const availableCards = allAvailableCards
            .filter((card: Card) => !currentDeck.some((s: Card) => s.baseName === card.baseName));
        
        // Sort by synergy with current deck
        const sortedAvailable = availableCards.sort((a: Card, b: Card) => 
            calculateSynergy(b, currentDeck) - calculateSynergy(a, currentDeck)
        );
        
        for (let i = 0; i < Math.min(remainingSlots, sortedAvailable.length); i++) {
            const card = sortedAvailable[i];
            currentDeck.push(card);
            if (card.baseName) {
                currentCopies[card.baseName] = (currentCopies[card.baseName] || 0) + 1;
            }
            addedCards.push(card);
        }
    }
    
    return {
        completedDeck: currentDeck,
        copiesInDeck: currentCopies,
        addedCards
    };
}

/**
 * Add cards to address elemental deficiencies
 */
export function addElementalFixingCards(
    selectedSpells: Card[], 
    allAvailableCards: Card[], 
    elementalAnalysis: any,
    copiesInDeck: Record<string, number>,
    calculateElementalDeficitContribution: (card: Card, analysis: any) => number
): { updatedDeck: Card[], updatedCopies: Record<string, number>, addedCount: number } {
    const updatedDeck = [...selectedSpells];
    const updatedCopies = { ...copiesInDeck };
    let addedCount = 0;
    
    for (const card of allAvailableCards) {
        if (addedCount >= 5 || updatedDeck.length >= 60) break;
        
        const elementContribution = calculateElementalDeficitContribution(card, elementalAnalysis);
        if (elementContribution > 0) {
            updatedDeck.push(card);
            if (card.baseName) {
                updatedCopies[card.baseName] = (updatedCopies[card.baseName] || 0) + 1;
            }
            addedCount++;
        }
    }
    
    return { updatedDeck, updatedCopies, addedCount };
}
