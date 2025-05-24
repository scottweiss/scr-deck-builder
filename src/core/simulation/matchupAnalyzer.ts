import { Card } from './gameState';
import { SimulationConfig } from './matchSimulator';
import { AI_STRATEGIES } from './aiEngine';
import { calculateFavorability } from './deckAnalyzer';
import { identifyMatchupFactors } from './deckAnalyzer';
import { convertToPlayerDeck } from './testDeckUtils';
import {
    MatchupAnalysis,
    MatchupResult
} from './deckTestTypes';

/**
 * Run matchup analysis between two decks
 */
export async function analyzeMatchup(
    batchRunner: any,
    deck1: { name: string; cards: Card[] },
    deck2: { name: string; cards: Card[] },
    iterations: number = 200
): Promise<MatchupAnalysis> {
    const config: SimulationConfig = {
        player1Deck: convertToPlayerDeck(deck1.cards),
        player2Deck: convertToPlayerDeck(deck2.cards),
        player1Strategy: AI_STRATEGIES.MIDRANGE,
        player2Strategy: AI_STRATEGIES.MIDRANGE,
        maxTurns: 50,
        timeoutMs: 30000,
        enableLogging: false
    };

    const result = await batchRunner.runBatch(config, iterations);
    
    return {
        deck1: deck1.name,
        deck2: deck2.name,
        deck1WinRate: result.player1WinRate,
        favorability: calculateFavorability(result.player1WinRate),
        keyFactors: identifyMatchupFactors(result)
    };
}

/**
 * Test different AI strategies with the same deck
 */
export async function testDeckStrategies(
    batchRunner: any,
    deck: Card[],
    opponentDeck: Card[],
    iterations: number = 100
): Promise<{ [strategy: string]: number }> {
    const strategyResults: { [strategy: string]: number } = {};

    for (const [strategyName, strategy] of Object.entries(AI_STRATEGIES)) {
        const config: SimulationConfig = {
            player1Deck: convertToPlayerDeck(deck),
            player2Deck: convertToPlayerDeck(opponentDeck),
            player1Strategy: strategy,
            player2Strategy: AI_STRATEGIES.MIDRANGE,
            maxTurns: 50,
            timeoutMs: 30000,
            enableLogging: false
        };

        const result = await batchRunner.runBatch(config, iterations);
        strategyResults[strategyName] = result.player1WinRate;
    }

    return strategyResults;
}
