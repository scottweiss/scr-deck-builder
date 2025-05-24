/**
 * Integration module to connect the match simulation system 
 * with the existing deck building system
 */

import { Card } from '../../types/Card';
import { MatchSimulator, SimulationConfig, SimulationResult, BatchResult } from './matchSimulator';
import { DeckTestSuite, MetaAnalysisResult, MatchupResult, ConsistencyResult } from './deckTestSuite';
import { AI_STRATEGIES, AIStrategy } from './aiEngine';
import { GameState } from './gameState';

export interface DeckSimulationConfig {
    deck: Card[];
    opponentDecks?: Card[][];
    strategy?: AIStrategy;
    testRuns?: number;
    maxTurns?: number;
    timeoutMs?: number;
    enableLogging?: boolean;
    metaDecksOnly?: boolean;
}

export interface DeckPerformanceReport {
    winRate: number;
    averageTurns: number;
    winsByTurn: { [turn: number]: number };
    winsByReason: { [reason: string]: number };
    consistency: {
        score: number;
        issues: string[];
        recommendations: string[];
    };
    matchupResults: MatchupResult[];
    strengthsAndWeaknesses: {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    };
    deckOptimization: {
        cardChanges: Array<{
            action: 'add' | 'remove' | 'replace';
            card: string;
            replacement?: string;
            reason: string;
            priority: number;
        }>;
        elementBalance: {
            current: { [element: string]: number };
            recommended: { [element: string]: number };
        };
        curveAnalysis: {
            current: number[];
            recommended: number[];
            issues: string[];
        };
    };
}

export class SimulationIntegration {
    private simulator: MatchSimulator;
    private testSuite: DeckTestSuite;

    constructor() {
        this.simulator = new MatchSimulator();
        this.testSuite = new DeckTestSuite();
    }

    /**
     * Analyzes a deck's performance against the meta
     */
    public async analyzeDeckPerformance(config: DeckSimulationConfig): Promise<DeckPerformanceReport> {
        console.log('Starting comprehensive deck analysis...');
        
        const testRuns = config.testRuns || 100;
        const strategy = config.strategy || AI_STRATEGIES.MIDRANGE;
        
        // Run meta analysis
        const metaResults = await this.testSuite.analyzeAgainstMeta(
            config.deck,
            strategy,
            testRuns
        );

        // Run consistency analysis
        const consistencyResults = await this.testSuite.analyzeConsistency(
            config.deck,
            strategy,
            testRuns
        );

        // Run specific matchup tests if opponent decks provided
        let matchupResults: MatchupResult[] = [];
        if (config.opponentDecks) {
            for (const opponentDeck of config.opponentDecks) {
                const matchup = await this.testSuite.testMatchup(
                    config.deck,
                    opponentDeck,
                    strategy,
                    AI_STRATEGIES.MIDRANGE,
                    Math.min(testRuns, 50) // Fewer runs for specific matchups
                );
                matchupResults.push(matchup);
            }
        }

        // Generate comprehensive report
        return this.generatePerformanceReport(
            metaResults,
            consistencyResults,
            matchupResults,
            config.deck
        );
    }

    /**
     * Tests multiple deck variations to find optimal build
     */
    public async optimizeDeck(
        baseDeck: Card[],
        variations: Card[][],
        strategy: AIStrategy = AI_STRATEGIES.MIDRANGE,
        testRuns: number = 50
    ): Promise<{
        bestDeck: Card[];
        results: DeckPerformanceReport[];
        improvements: string[];
    }> {
        console.log(`Testing ${variations.length} deck variations...`);
        
        const results: DeckPerformanceReport[] = [];
        
        // Test base deck
        const baseResult = await this.analyzeDeckPerformance({
            deck: baseDeck,
            strategy,
            testRuns
        });
        results.push(baseResult);

        // Test variations
        for (let i = 0; i < variations.length; i++) {
            console.log(`Testing variation ${i + 1}/${variations.length}...`);
            
            const variationResult = await this.analyzeDeckPerformance({
                deck: variations[i],
                strategy,
                testRuns
            });
            results.push(variationResult);
        }

        // Find best performing deck
        const bestIndex = results.reduce((bestIdx, current, index) => {
            return current.winRate > results[bestIdx].winRate ? index : bestIdx;
        }, 0);

        const bestDeck = bestIndex === 0 ? baseDeck : variations[bestIndex - 1];
        const improvements = this.identifyImprovements(results[0], results[bestIndex]);

        return {
            bestDeck,
            results,
            improvements
        };
    }

    /**
     * Simulates a quick match between two decks
     */
    public async simulateMatch(
        deck1: Card[],
        deck2: Card[],
        strategy1: AIStrategy = AI_STRATEGIES.MIDRANGE,
        strategy2: AIStrategy = AI_STRATEGIES.MIDRANGE,
        options: {
            maxTurns?: number;
            timeoutMs?: number;
            enableLogging?: boolean;
        } = {}
    ): Promise<SimulationResult> {
        const config: SimulationConfig = {
            player1Deck: deck1,
            player2Deck: deck2,
            player1Strategy: strategy1,
            player2Strategy: strategy2,
            maxTurns: options.maxTurns || 50,
            timeoutMs: options.timeoutMs || 30000,
            enableLogging: options.enableLogging || false
        };

        return await this.simulator.simulateMatch(config);
    }

    /**
     * Batch simulation for statistical analysis
     */
    public async batchSimulate(
        deck1: Card[],
        deck2: Card[],
        runs: number = 100,
        strategy1: AIStrategy = AI_STRATEGIES.MIDRANGE,
        strategy2: AIStrategy = AI_STRATEGIES.MIDRANGE
    ): Promise<BatchResult> {
        console.log(`Running batch simulation: ${runs} games...`);
        
        const results: SimulationResult[] = [];
        
        for (let i = 0; i < runs; i++) {
            if (i % 10 === 0) {
                console.log(`Progress: ${i}/${runs} games completed`);
            }
            
            try {
                const result = await this.simulateMatch(deck1, deck2, strategy1, strategy2, {
                    enableLogging: false,
                    timeoutMs: 15000 // Shorter timeout for batch runs
                });
                results.push(result);
            } catch (error) {
                console.warn(`Game ${i + 1} failed:`, error);
                // Continue with other games
            }
        }

        return this.analyzeBatchResults(results, deck1, deck2);
    }

    /**
     * Validates deck composition and suggests fixes
     */
    public validateDeck(deck: Card[]): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        suggestions: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];

        // Check deck size
        if (deck.length < 60) {
            errors.push(`Deck has ${deck.length} cards, minimum is 60`);
        } else if (deck.length > 60) {
            warnings.push(`Deck has ${deck.length} cards, consider reducing to 60 for consistency`);
        }

        // Check for banned cards (if any)
        const bannedCards = deck.filter(card => card.banned);
        if (bannedCards.length > 0) {
            errors.push(`Deck contains banned cards: ${bannedCards.map(c => c.name).join(', ')}`);
        }

        // Check card limits (4-of rule)
        const cardCounts = new Map<string, number>();
        deck.forEach(card => {
            const count = cardCounts.get(card.name) || 0;
            cardCounts.set(card.name, count + 1);
        });

        cardCounts.forEach((count, cardName) => {
            if (count > 4) {
                errors.push(`Too many copies of ${cardName}: ${count} (max 4)`);
            }
        });

        // Analyze mana curve
        const manaCurve = this.analyzeManaRising(deck);
        if (manaCurve.issues.length > 0) {
            warnings.push(...manaCurve.issues);
        }

        // Check elemental balance
        const elementBalance = this.analyzeElementBalance(deck);
        if (elementBalance.warnings.length > 0) {
            warnings.push(...elementBalance.warnings);
        }

        // Suggest improvements
        if (deck.length === 60) {
            suggestions.push('Consider testing deck variations with different card ratios');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    private generatePerformanceReport(
        metaResults: MetaAnalysisResult,
        consistencyResults: ConsistencyResult,
        matchupResults: MatchupResult[],
        deck: Card[]
    ): DeckPerformanceReport {
        // Calculate overall win rate
        const winRate = metaResults.overallWinRate;

        // Analyze wins by turn and reason
        const winsByTurn: { [turn: number]: number } = {};
        const winsByReason: { [reason: string]: number } = {};

        metaResults.results.forEach(result => {
            if (result.winner === 'player1') {
                winsByTurn[result.turns] = (winsByTurn[result.turns] || 0) + 1;
                winsByReason[result.reason] = (winsByReason[result.reason] || 0) + 1;
            }
        });

        // Generate strengths and weaknesses
        const { strengths, weaknesses, recommendations } = this.analyzeStrengthsAndWeaknesses(
            metaResults,
            matchupResults
        );

        // Generate deck optimization suggestions
        const deckOptimization = this.generateOptimizationSuggestions(deck, metaResults, consistencyResults);

        return {
            winRate,
            averageTurns: metaResults.results.reduce((sum, r) => sum + r.turns, 0) / metaResults.results.length,
            winsByTurn,
            winsByReason,
            consistency: {
                score: consistencyResults.consistencyScore,
                issues: consistencyResults.issues,
                recommendations: consistencyResults.recommendations
            },
            matchupResults,
            strengthsAndWeaknesses: {
                strengths,
                weaknesses,
                recommendations
            },
            deckOptimization
        };
    }

    private analyzeStrengthsAndWeaknesses(
        metaResults: MetaAnalysisResult,
        matchupResults: MatchupResult[]
    ): { strengths: string[]; weaknesses: string[]; recommendations: string[] } {
        const strengths: string[] = [];
        const weaknesses: string[] = [];
        const recommendations: string[] = [];

        // Analyze win rate
        if (metaResults.overallWinRate > 0.6) {
            strengths.push('Strong overall performance against meta');
        } else if (metaResults.overallWinRate < 0.4) {
            weaknesses.push('Poor performance against meta decks');
            recommendations.push('Consider major deck revisions or different strategy');
        }

        // Analyze matchup spread
        const goodMatchups = matchupResults.filter(m => m.winRate > 0.6).length;
        const badMatchups = matchupResults.filter(m => m.winRate < 0.4).length;

        if (goodMatchups > badMatchups) {
            strengths.push('Favorable matchup spread');
        } else if (badMatchups > goodMatchups) {
            weaknesses.push('Unfavorable matchup spread');
            recommendations.push('Add sideboard cards for problem matchups');
        }

        return { strengths, weaknesses, recommendations };
    }

    private generateOptimizationSuggestions(
        deck: Card[],
        metaResults: MetaAnalysisResult,
        consistencyResults: ConsistencyResult
    ): DeckPerformanceReport['deckOptimization'] {
        const cardChanges: DeckPerformanceReport['deckOptimization']['cardChanges'] = [];

        // Analyze underperforming cards
        const cardPerformance = this.analyzeCardPerformance(deck, metaResults);
        
        Object.entries(cardPerformance.underperforming).forEach(([cardName, data]) => {
            cardChanges.push({
                action: 'remove',
                card: cardName,
                reason: `Low impact: ${data.reason}`,
                priority: data.priority
            });
        });

        // Suggest additions
        Object.entries(cardPerformance.suggested).forEach(([cardName, data]) => {
            cardChanges.push({
                action: 'add',
                card: cardName,
                reason: `High value addition: ${data.reason}`,
                priority: data.priority
            });
        });

        // Analyze element balance
        const elementBalance = this.analyzeElementBalance(deck);
        
        // Analyze mana curve
        const curveAnalysis = this.analyzeManaRising(deck);

        return {
            cardChanges: cardChanges.sort((a, b) => b.priority - a.priority),
            elementBalance: {
                current: elementBalance.current,
                recommended: elementBalance.recommended
            },
            curveAnalysis: {
                current: curveAnalysis.curve,
                recommended: curveAnalysis.recommended,
                issues: curveAnalysis.issues
            }
        };
    }

    private analyzeCardPerformance(
        deck: Card[],
        metaResults: MetaAnalysisResult
    ): {
        underperforming: { [cardName: string]: { reason: string; priority: number } };
        suggested: { [cardName: string]: { reason: string; priority: number } };
    } {
        // This would analyze game logs to determine card performance
        // For now, return placeholder data
        return {
            underperforming: {},
            suggested: {}
        };
    }

    private analyzeElementBalance(deck: Card[]): {
        current: { [element: string]: number };
        recommended: { [element: string]: number };
        warnings: string[];
    } {
        const current: { [element: string]: number } = {};
        const warnings: string[] = [];

        // Count elements in deck
        deck.forEach(card => {
            if (card.elements) {
                card.elements.forEach(element => {
                    current[element] = (current[element] || 0) + 1;
                });
            }
        });

        // Simple recommendations (would be more sophisticated in practice)
        const recommended = { ...current };
        
        const totalElements = Object.values(current).reduce((sum, count) => sum + count, 0);
        const elementTypes = Object.keys(current).length;

        if (elementTypes > 2) {
            warnings.push('Too many elements may lead to consistency issues');
        }

        if (totalElements < deck.length * 0.8) {
            warnings.push('Consider adding more elemental cards for threshold consistency');
        }

        return { current, recommended, warnings };
    }

    private analyzeManaRising(deck: Card[]): {
        curve: number[];
        recommended: number[];
        issues: string[];
    } {
        const curve = new Array(10).fill(0);
        const issues: string[] = [];

        // Count cards by mana cost
        deck.forEach(card => {
            const cost = Math.min(card.cost || 0, 9);
            curve[cost]++;
        });

        // Simple curve analysis
        if (curve[0] + curve[1] + curve[2] < deck.length * 0.3) {
            issues.push('Not enough early game cards');
        }

        if (curve[6] + curve[7] + curve[8] + curve[9] > deck.length * 0.15) {
            issues.push('Too many expensive cards');
        }

        // Generate recommended curve (simplified)
        const recommended = [
            0, // 0 mana
            Math.floor(deck.length * 0.1), // 1 mana
            Math.floor(deck.length * 0.15), // 2 mana
            Math.floor(deck.length * 0.2), // 3 mana
            Math.floor(deck.length * 0.2), // 4 mana
            Math.floor(deck.length * 0.15), // 5 mana
            Math.floor(deck.length * 0.1), // 6 mana
            Math.floor(deck.length * 0.05), // 7 mana
            Math.floor(deck.length * 0.03), // 8 mana
            Math.floor(deck.length * 0.02)  // 9+ mana
        ];

        return { curve, recommended, issues };
    }

    private identifyImprovements(baseResult: DeckPerformanceReport, bestResult: DeckPerformanceReport): string[] {
        const improvements: string[] = [];

        const winRateImprovement = bestResult.winRate - baseResult.winRate;
        if (winRateImprovement > 0.05) {
            improvements.push(`Win rate improved by ${(winRateImprovement * 100).toFixed(1)}%`);
        }

        const consistencyImprovement = bestResult.consistency.score - baseResult.consistency.score;
        if (consistencyImprovement > 0.1) {
            improvements.push(`Consistency improved by ${(consistencyImprovement * 100).toFixed(1)}%`);
        }

        if (bestResult.averageTurns < baseResult.averageTurns - 1) {
            improvements.push('Games end faster (more aggressive)');
        } else if (bestResult.averageTurns > baseResult.averageTurns + 1) {
            improvements.push('Games last longer (more controlling)');
        }

        return improvements;
    }

    private analyzeBatchResults(results: SimulationResult[], deck1: Card[], deck2: Card[]): BatchResult {
        const totalGames = results.length;
        const player1Wins = results.filter(r => r.winner === 'player1').length;
        const player2Wins = results.filter(r => r.winner === 'player2').length;
        const ties = results.filter(r => r.winner === null).length;

        const avgTurns = results.reduce((sum, r) => sum + r.turns, 0) / totalGames;
        const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalGames;

        const winByReason: { [reason: string]: number } = {};
        results.forEach(r => {
            winByReason[r.reason] = (winByReason[r.reason] || 0) + 1;
        });

        return {
            totalGames,
            player1Wins,
            player2Wins,
            ties,
            player1WinRate: player1Wins / totalGames,
            player2WinRate: player2Wins / totalGames,
            averageTurns: avgTurns,
            averageDuration: avgDuration,
            winsByReason: winByReason,
            results
        };
    }
}

/**
 * Utility functions for deck analysis and optimization
 */
export class DeckAnalysisUtils {
    /**
     * Suggests deck improvements based on meta analysis
     */
    static suggestDeckImprovements(deck: Card[], metaData: any): string[] {
        const suggestions: string[] = [];

        // Analyze against current meta
        // This would use real meta data
        suggestions.push('Consider adding more removal spells');
        suggestions.push('Mana curve could be improved');
        suggestions.push('Add more card draw');

        return suggestions;
    }

    /**
     * Generates multiple deck variations for testing
     */
    static generateDeckVariations(baseDeck: Card[], variations: number = 5): Card[][] {
        const variants: Card[][] = [];

        // Simple variation generation (would be more sophisticated)
        for (let i = 0; i < variations; i++) {
            const variant = [...baseDeck];
            
            // Make small changes
            // This is a placeholder - real implementation would make strategic changes
            if (variant.length > 60) {
                variant.splice(Math.floor(Math.random() * variant.length), 1);
            }
            
            variants.push(variant);
        }

        return variants;
    }

    /**
     * Compares two decks and highlights differences
     */
    static compareDeckLists(deck1: Card[], deck2: Card[]): {
        added: Card[];
        removed: Card[];
        common: Card[];
    } {
        const deck1Names = new Set(deck1.map(c => c.name));
        const deck2Names = new Set(deck2.map(c => c.name));

        const added = deck2.filter(card => !deck1Names.has(card.name));
        const removed = deck1.filter(card => !deck2Names.has(card.name));
        const common = deck1.filter(card => deck2Names.has(card.name));

        return { added, removed, common };
    }
}
