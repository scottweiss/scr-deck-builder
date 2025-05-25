import { Card } from '../core/gameState';
import {
    PerformanceReport,
    DeckTestResult,
    ConsistencyReport,
    DeckComposition
} from '../types/deckTestTypes';

import { analyzeDeckComposition } from './deckAnalyzer';

/**
 * Generate a comprehensive performance report for a deck
 */
export async function generatePerformanceReport(
    testDeckAgainstMeta: Function,
    testDeckConsistency: Function,
    testDeckStrategies: Function,
    deck: Card[],
    deckName: string,
    baselineDeck: Card[],
    iterations: number = 200
): Promise<PerformanceReport> {
    console.log(`Generating performance report for ${deckName}...`);

    // Test against meta
    const metaDecks = [{name: 'test', cards: baselineDeck}]; // Replace with actual meta decks
    const metaTest = await testDeckAgainstMeta(deck, metaDecks, iterations);

    // Test consistency
    const consistencyTest = await testDeckConsistency(deck, iterations);

    // Test strategies
    const strategyTest = await testDeckStrategies(deck, baselineDeck, iterations);

    // Analyze deck composition
    const composition = analyzeDeckComposition(deck);

    return {
        deckName,
        metaPerformance: metaTest,
        consistency: consistencyTest,
        strategyPerformance: strategyTest,
        composition,
        overallRating: calculateOverallRating(metaTest, consistencyTest),
        strengths: metaTest.strengths,  // Extract to top level for test compatibility
        weaknesses: metaTest.weaknesses,
        recommendations: metaTest.recommendations,
        timestamp: Date.now()
    };
}

/**
 * Calculate an overall rating for the deck
 */
export function calculateOverallRating(metaTest: DeckTestResult, consistency: ConsistencyReport): number {
    const winRateScore = metaTest.winRate * 40;
    const consistencyScore = consistency.consistencyScore * 30;
    const performanceScore = metaTest.performance === 'excellent' ? 30 :
                            metaTest.performance === 'good' ? 20 :
                            metaTest.performance === 'average' ? 10 : 0;
    
    return Math.min(100, winRateScore + consistencyScore + performanceScore);
}
