import { Card } from '../../../types/Card';
import { BatchResult, SimulationConfig } from '../core/matchSimulator';
import { AI_STRATEGIES } from '../ai/aiStrategies';
import { convertToPlayerDeck } from '../testing/testDeckUtils';
import {
    DeckTestResult,
    MetaAnalysisResult,
    MatchupResult,
    ConsistencyReport
} from '../types/deckTestTypes';
import { SYSTEM_MODE } from '../../../config';

import { analyzeConsistency } from './consistencyAnalyzer';
import {
    classifyPerformance,
    identifyStrengths,
    identifyWeaknesses,
    generateRecommendations
} from './deckAnalyzer';

/**
 * Convert Card to simulation Card interface
 */
function convertToSimCard(card: Card) {
    return {
        id: card.productId || card.name,
        name: card.name,
        type: card.type,
        cost: card.cost || card.mana_cost || 0,
        effect: card.text || card.extDescription,
        keywords: [],
        subtypes: card.subTypeName ? [card.subTypeName] : [],
        power: card.power || 0,
        life: card.life,
        defense: card.defense,
        mana_cost: card.mana_cost,
        text: card.text,
        elements: card.elements,
        rarity: card.rarity,
        baseName: card.baseName
    };
}


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

    // Convert to simulation cards for analysis
    const simTestDeck = testDeck.map(convertToSimCard);

    const performance = classifyPerformance(overallWinRate);
    const strengths = identifyStrengths(simTestDeck, results);
    const weaknesses = identifyWeaknesses(simTestDeck, results);
    const recommendations = generateRecommendations(simTestDeck, results);

    return {
        deckName: 'Test Deck',
        winRate: overallWinRate,
        overallWinRate: overallWinRate,  // Add alias for test compatibility
        averageTurns,
        performance,
        strengths,
        weaknesses,
        recommendations,
        matchupResults: results.map((result, index) => ({
            opponentName: metaDecks[index]?.name || `Opponent ${index + 1}`,
            winRate: result.player1WinRate,
            averageTurns: result.averageTurns,
            favorability: result.player1WinRate >= 0.6 ? 'favored' : 
                         result.player1WinRate <= 0.4 ? 'unfavored' : 'even' as any,
            keyFactors: ['Test matchup'],
            turns: result.averageTurns,
            gamesPlayed: result.totalGames
        }))
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

// Add this debug function for elemental threshold analysis
function debugElementalThresholds(deck: Card[], getCardThreshold: (card: Card) => any) {
    if (SYSTEM_MODE.DEBUG) {
        console.log('Deck for elemental threshold analysis:');
        deck.forEach(card => {
            console.log({
                name: card.name,
                elements: card.elements,
                threshold: getCardThreshold(card)
            });
        });
    }
}

// Add this export so it can be called from deck building/analysis logic
export { debugElementalThresholds };
