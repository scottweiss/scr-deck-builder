import { MatchSimulator, SimulationBatch } from './matchSimulator';
import { Card } from './gameState';
import { Element, CardType } from '../../types/Card';

// Import modular components
import {
    convertToPlayerDeck,
    createBaselineDeck,
    getMetaDecks
} from './testDeckUtils';

import {
    testDeckAgainstMeta,
    testDeckConsistency,
    DeckTestResult,
    MetaAnalysisResult,
    MatchupResult
} from './metaTester';

import {
    analyzeMatchup,
    testDeckStrategies,
    MatchupAnalysis
} from './matchupAnalyzer';

import {
    optimizeDeck,
    DeckOptimizationResult
} from './deckOptimizer';

import {
    generatePerformanceReport,
    PerformanceReport
} from './performanceReporter';

import { ConsistencyReport } from './consistencyAnalyzer';
import { DeckComposition } from './deckAnalyzer';

// Re-export interfaces for backward compatibility
export interface DeckTestResult {
    deckName: string;
    winRate: number;
    averageTurns: number;
    performance: 'excellent' | 'good' | 'average' | 'poor';
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

export interface MatchupAnalysis {
    deck1: string;
    deck2: string;
    deck1WinRate: number;
    favorability: 'heavily_favored' | 'favored' | 'even' | 'unfavored' | 'heavily_unfavored';
    keyFactors: string[];
}

export interface ConsistencyReport {
    winRateVariance: number;
    turnVariance: number;
    consistencyScore: number;
    recommendations: string[];
}

export interface DeckOptimizationResult {
    originalDeck: Card[];
    optimizedDeck: Card[];
    improvements: string[];
    winRateImprovement: number;
}

export interface MetaAnalysisResult {
    deckName: string;
    results: any[]; // Changed from MatchupResult[] to avoid circular references
    winRate: number;
    matchups: {
        favorable: number;
        even: number;
        unfavorable: number;
    };
}

export interface MatchupResult {
    opponentName: string;
    winRate: number;
    favorability: 'heavily_favored' | 'favored' | 'even' | 'unfavorable' | 'heavily_unfavored';
    keyFactors: string[];
    turns: number;
    gamesPlayed: number;
}

export interface PerformanceReport {
    deckName: string;
    metaPerformance: DeckTestResult;
    consistency: ConsistencyReport;
    strategyPerformance: { [strategy: string]: number };
    composition: DeckComposition;
    overallRating: number;
    timestamp: number;
}

export interface DeckComposition {
    units: number;
    spells: number;
    sites: number;
    elements: { air: number; earth: number; fire: number; water: number };
    manaCurve: number[];
    averageCost: number;
}

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
