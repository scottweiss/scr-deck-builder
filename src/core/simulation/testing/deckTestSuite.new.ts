import { MatchSimulator, SimulationBatch } from '../core/matchSimulator';
import { Card } from '../../../types/Card';
import { Element, CardType } from '../../../types/Card';
import {
    testDeckAgainstMeta,
    testDeckConsistency
} from '../analysis/metaTester';
import {
    analyzeMatchup,
    testDeckStrategies
} from '../analysis/matchupAnalyzer';
import {
    optimizeDeck
} from '../analysis/deckOptimizer';
import {
    generatePerformanceReport
} from '../analysis/performanceReporter';
import {
    DeckTestResult,
    MatchupAnalysis,
    ConsistencyReport,
    DeckOptimizationResult,
    MetaAnalysisResult,
    MatchupResult,
    PerformanceReport,
    DeckComposition
} from '../types/deckTestTypes';

import {
    convertToPlayerDeck,
    createBaselineDeck,
    getMetaDecks
} from './testDeckUtils';

/**
 * Main class for deck testing functionality
 */
export class DeckTestSuite {
    private simulator: MatchSimulator;
    private batchRunner: SimulationBatch;

    constructor() {
        this.simulator = new MatchSimulator();
        this.batchRunner = new SimulationBatch();
    }

    /**
     * Tests a deck against a variety of meta decks
     */
    public async testDeckAgainstMeta(
        testDeck: Card[],
        metaDecks: { name: string; cards: Card[] }[],
        iterations: number = 100
    ): Promise<DeckTestResult> {
        return testDeckAgainstMeta(this.batchRunner, testDeck, metaDecks, iterations);
    }

    /**
     * Analyzes matchup between two specific decks
     */
    public async analyzeMatchup(
        deck1: { name: string; cards: Card[] },
        deck2: { name: string; cards: Card[] },
        iterations: number = 200
    ): Promise<MatchupAnalysis> {
        return analyzeMatchup(this.batchRunner, deck1, deck2, iterations);
    }

    /**
     * Tests different AI strategies with the same deck
     */
    public async testDeckStrategies(
        deck: Card[],
        opponentDeck: Card[],
        iterations: number = 100
    ): Promise<{ [strategy: string]: number }> {
        return testDeckStrategies(this.batchRunner, deck, opponentDeck, iterations);
    }

    /**
     * Stress tests a deck's consistency
     */
    public async testDeckConsistency(
        deck: Card[],
        iterations: number = 500
    ): Promise<ConsistencyReport> {
        // Use a baseline deck for comparison
        const baselineDeck = createBaselineDeck();
        return testDeckConsistency(this.batchRunner, deck, baselineDeck, iterations);
    }

    /**
     * Identifies optimal deck composition through iterative testing
     */
    public async optimizeDeck(
        baseDeck: Card[],
        cardPool: Card[],
        iterations: number = 50
    ): Promise<DeckOptimizationResult> {
        // Using bind to preserve the this context in the callback
        return optimizeDeck(
            this.testDeckAgainstMeta.bind(this),
            baseDeck,
            cardPool,
            iterations
        );
    }

    /**
     * Generates a comprehensive performance report for a deck
     */
    public async generatePerformanceReport(
        deck: Card[],
        deckName: string,
        iterations: number = 200
    ): Promise<PerformanceReport> {
        const baselineDeck = createBaselineDeck();
        return generatePerformanceReport(
            this.testDeckAgainstMeta.bind(this),
            this.testDeckConsistency.bind(this),
            this.testDeckStrategies.bind(this),
            deck,
            deckName,
            baselineDeck,
            iterations
        );
    }
}
