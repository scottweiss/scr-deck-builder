import { Card } from './gameState';
import { BatchResult, SimulationConfig } from './matchSimulator';
import { AI_STRATEGIES } from './aiEngine';
import { convertToPlayerDeck } from './testDeckUtils';
import { 
    analyzeConsistency, 
    ConsistencyReport 
} from './consistencyAnalyzer';
import { 
    identifyStrengths, 
    identifyWeaknesses, 
    generateRecommendations, 
    classifyPerformance 
} from './deckAnalyzer';
import {
    DeckTestResult,
    MetaAnalysisResult,
    MatchupResult
} from './deckTestTypes';

/**
 * Test a deck against the meta
 */
export async function testDeckAgainstMeta(
    batchRunner: any,
    testDeck: Card[],
    metaDecks: { name: string; cards: Card[] }[],
    iterations: number = 100
): Promise<DeckTestResult> {
    const results: BatchResult[] = [];
    
    console.log(`Testing deck against ${metaDecks.length} meta decks...`);

    for (const metaDeck of metaDecks) {
        const config: SimulationConfig = {
            player1Deck: convertToPlayerDeck(testDeck),
            player2Deck: convertToPlayerDeck(metaDeck.cards),
            player1Strategy: AI_STRATEGIES.MIDRANGE,
            player2Strategy: AI_STRATEGIES.MIDRANGE,
            maxTurns: 50,
            timeoutMs: 30000,
            enableLogging: false
        };

        const result = await batchRunner.runBatch(config, iterations);
        results.push(result);
    }

    return analyzeTestResults(testDeck, results, metaDecks);
}

/**
 * Analyze test results
 */
export function analyzeTestResults(
    testDeck: Card[],
    results: BatchResult[],
    metaDecks: { name: string; cards: Card[] }[]
): DeckTestResult {
    const overallWinRate = results.reduce((sum, r) => sum + r.player1WinRate, 0) / results.length;
    const averageTurns = results.reduce((sum, r) => sum + r.averageTurns, 0) / results.length;

    const performance = classifyPerformance(overallWinRate);
    const strengths = identifyStrengths(testDeck, results);
    const weaknesses = identifyWeaknesses(testDeck, results);
    const recommendations = generateRecommendations(testDeck, results);

    return {
        deckName: 'Test Deck',
        winRate: overallWinRate,
        averageTurns,
        performance,
        strengths,
        weaknesses,
        recommendations
    };
}

/**
 * Test a deck's consistency
 */
export async function testDeckConsistency(
    batchRunner: any,
    deck: Card[],
    baselineDeck: Card[],
    iterations: number = 500
): Promise<ConsistencyReport> {
    // Test against a baseline balanced deck
    const config: SimulationConfig = {
        player1Deck: convertToPlayerDeck(deck),
        player2Deck: convertToPlayerDeck(baselineDeck),
        player1Strategy: AI_STRATEGIES.MIDRANGE,
        player2Strategy: AI_STRATEGIES.MIDRANGE,
        maxTurns: 50,
        timeoutMs: 30000,
        enableLogging: false
    };

    const result = await batchRunner.runBatch(config, iterations);
    
    return analyzeConsistency(result);
}
