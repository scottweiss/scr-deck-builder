// Type and interface definitions for deck test suite and related modules
import { Card } from '../../../types/Card';

export interface DeckComposition {
    units: number;
    spells: number;
    sites: number;
    elements: { air: number; earth: number; fire: number; water: number };
    manaCurve: number[];
    averageCost: number;
}

export interface DeckTestResult {
    deckName: string;
    winRate: number;
    overallWinRate: number;  // Add alias for test compatibility
    averageTurns: number;
    performance: 'excellent' | 'good' | 'average' | 'poor';
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    matchupResults: MatchupResult[];
}

export interface MatchupAnalysis {
    deck1: string;
    deck2: string;
    deck1WinRate: number;
    winRate: number;  // Add alias for test compatibility
    averageTurns: number;  // Add missing property
    favorability: 'heavily_favored' | 'favored' | 'even' | 'unfavored' | 'heavily_unfavored';
    keyFactors: string[];
}

export interface ConsistencyReport {
    winRateVariance: number;
    turnVariance: number;
    consistencyScore: number;
    varianceMetrics: {  // Add missing property
        winRate: number;
        turns: number;
        overall: number;
    };
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
    averageTurns: number;  // Add missing property
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
    strengths: string[];  // Add top-level properties for test compatibility
    weaknesses: string[];
    recommendations: string[];
    timestamp: number;
}
