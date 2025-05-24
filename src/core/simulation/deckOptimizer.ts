import { Card } from './gameState';
import { getMetaDecks } from './testDeckUtils';
import { DeckOptimizationResult } from './deckTestTypes';

/**
 * Make a random substitution in a deck
 */
export function makeRandomSubstitution(deck: Card[], cardPool: Card[]): Card[] {
    const newDeck = [...deck];
    const removeIndex = Math.floor(Math.random() * newDeck.length);
    const addCard = cardPool[Math.floor(Math.random() * cardPool.length)];
    
    newDeck[removeIndex] = addCard;
    return newDeck;
}

/**
 * Identify improvements made between original and optimized deck
 */
export function identifyImprovements(originalDeck: Card[], optimizedDeck: Card[]): string[] {
    const improvements: string[] = [];
    
    for (let i = 0; i < originalDeck.length; i++) {
        if (originalDeck[i].productId !== optimizedDeck[i].productId) {
            improvements.push(`Replaced ${originalDeck[i].name} with ${optimizedDeck[i].name}`);
        }
    }
    
    return improvements;
}

/**
 * Optimize a deck through iterative testing
 */
export async function optimizeDeck(
    testDeckAgainstMeta: (testDeck: Card[], metaDecks: { name: string; cards: Card[] }[], iterations?: number) => Promise<any>,
    baseDeck: Card[],
    cardPool: Card[],
    iterations: number = 50
): Promise<DeckOptimizationResult> {
    let currentDeck = [...baseDeck];
    let bestDeck = [...baseDeck];
    let bestWinRate = 0;
    
    const metaDecks = getMetaDecks();
    
    // Initial test
    const initialResult = await testDeckAgainstMeta(currentDeck, metaDecks, iterations);
    bestWinRate = initialResult.winRate;
    
    console.log(`Initial win rate: ${(bestWinRate * 100).toFixed(1)}%`);

    // Try card substitutions
    for (let attempt = 0; attempt < 20; attempt++) {
        const testDeck = makeRandomSubstitution(currentDeck, cardPool);
        const testResult = await testDeckAgainstMeta(testDeck, metaDecks, iterations);
        
        if (testResult.winRate > bestWinRate) {
            bestDeck = [...testDeck];
            bestWinRate = testResult.winRate;
            currentDeck = [...testDeck];
            
            console.log(`Improvement found! New win rate: ${(bestWinRate * 100).toFixed(1)}%`);
        }
    }

    return {
        originalDeck: baseDeck,
        optimizedDeck: bestDeck,
        improvements: identifyImprovements(baseDeck, bestDeck),
        winRateImprovement: bestWinRate - initialResult.winRate
    };
}
