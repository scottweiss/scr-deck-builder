import { MatchSimulator, SimulationBatch, SimulationConfig, BatchResult } from './matchSimulator';
import { AI_STRATEGIES } from './aiEngine';
import { Card } from './gameState';

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
        const results: BatchResult[] = [];
        
        console.log(`Testing deck against ${metaDecks.length} meta decks...`);

        for (const metaDeck of metaDecks) {
            const config: SimulationConfig = {
                player1Deck: testDeck,
                player2Deck: metaDeck.cards,
                player1Strategy: AI_STRATEGIES.MIDRANGE,
                player2Strategy: AI_STRATEGIES.MIDRANGE,
                maxTurns: 50,
                timeoutMs: 30000,
                enableLogging: false
            };

            const result = await this.batchRunner.runBatch(config, iterations);
            results.push(result);
        }

        return this.analyzeTestResults(testDeck, results, metaDecks);
    }

    /**
     * Analyzes matchup between two specific decks
     */
    public async analyzeMatchup(
        deck1: { name: string; cards: Card[] },
        deck2: { name: string; cards: Card[] },
        iterations: number = 200
    ): Promise<MatchupAnalysis> {
        const config: SimulationConfig = {
            player1Deck: deck1.cards,
            player2Deck: deck2.cards,
            player1Strategy: AI_STRATEGIES.MIDRANGE,
            player2Strategy: AI_STRATEGIES.MIDRANGE,
            maxTurns: 50,
            timeoutMs: 30000,
            enableLogging: false
        };

        const result = await this.batchRunner.runBatch(config, iterations);
        
        return {
            deck1: deck1.name,
            deck2: deck2.name,
            deck1WinRate: result.player1WinRate,
            favorability: this.calculateFavorability(result.player1WinRate),
            keyFactors: this.identifyMatchupFactors(result)
        };
    }

    /**
     * Tests different AI strategies with the same deck
     */
    public async testDeckStrategies(
        deck: Card[],
        opponentDeck: Card[],
        iterations: number = 100
    ): Promise<{ [strategy: string]: number }> {
        const strategyResults: { [strategy: string]: number } = {};

        for (const [strategyName, strategy] of Object.entries(AI_STRATEGIES)) {
            const config: SimulationConfig = {
                player1Deck: deck,
                player2Deck: opponentDeck,
                player1Strategy: strategy,
                player2Strategy: AI_STRATEGIES.MIDRANGE,
                maxTurns: 50,
                timeoutMs: 30000,
                enableLogging: false
            };

            const result = await this.batchRunner.runBatch(config, iterations);
            strategyResults[strategyName] = result.player1WinRate;
        }

        return strategyResults;
    }

    /**
     * Stress tests a deck's consistency
     */
    public async testDeckConsistency(
        deck: Card[],
        iterations: number = 500
    ): Promise<ConsistencyReport> {
        // Test against a baseline balanced deck
        const baselineDeck = this.createBaselineDeck();
        
        const config: SimulationConfig = {
            player1Deck: deck,
            player2Deck: baselineDeck,
            player1Strategy: AI_STRATEGIES.MIDRANGE,
            player2Strategy: AI_STRATEGIES.MIDRANGE,
            maxTurns: 50,
            timeoutMs: 30000,
            enableLogging: false
        };

        const result = await this.batchRunner.runBatch(config, iterations);
        
        return this.analyzeConsistency(result);
    }

    /**
     * Identifies optimal deck composition through iterative testing
     */
    public async optimizeDeck(
        baseDeck: Card[],
        cardPool: Card[],
        iterations: number = 50
    ): Promise<DeckOptimizationResult> {
        let currentDeck = [...baseDeck];
        let bestDeck = [...baseDeck];
        let bestWinRate = 0;
        
        const metaDecks = this.getMetaDecks();
        
        // Initial test
        const initialResult = await this.testDeckAgainstMeta(currentDeck, metaDecks, iterations);
        bestWinRate = initialResult.winRate;
        
        console.log(`Initial win rate: ${(bestWinRate * 100).toFixed(1)}%`);

        // Try card substitutions
        for (let attempt = 0; attempt < 20; attempt++) {
            const testDeck = this.makeRandomSubstitution(currentDeck, cardPool);
            const testResult = await this.testDeckAgainstMeta(testDeck, metaDecks, iterations);
            
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
            improvement: bestWinRate - initialResult.winRate,
            finalWinRate: bestWinRate,
            changes: this.identifyChanges(baseDeck, bestDeck)
        };
    }

    /**
     * Generates a comprehensive performance report for a deck
     */
    public async generatePerformanceReport(
        deck: Card[],
        deckName: string,
        iterations: number = 200
    ): Promise<PerformanceReport> {
        console.log(`Generating performance report for ${deckName}...`);

        // Test against meta
        const metaDecks = this.getMetaDecks();
        const metaTest = await this.testDeckAgainstMeta(deck, metaDecks, iterations);

        // Test consistency
        const consistencyTest = await this.testDeckConsistency(deck, iterations);

        // Test strategies
        const baselineOpponent = this.createBaselineDeck();
        const strategyTest = await this.testDeckStrategies(deck, baselineOpponent, iterations);

        // Analyze deck composition
        const composition = this.analyzeDeckComposition(deck);

        return {
            deckName,
            metaPerformance: metaTest,
            consistency: consistencyTest,
            strategyPerformance: strategyTest,
            composition,
            overallRating: this.calculateOverallRating(metaTest, consistencyTest),
            timestamp: Date.now()
        };
    }

    // Helper methods
    private analyzeTestResults(
        testDeck: Card[],
        results: BatchResult[],
        metaDecks: { name: string; cards: Card[] }[]
    ): DeckTestResult {
        const overallWinRate = results.reduce((sum, r) => sum + r.player1WinRate, 0) / results.length;
        const averageTurns = results.reduce((sum, r) => sum + r.averageTurns, 0) / results.length;

        const performance = this.classifyPerformance(overallWinRate);
        const strengths = this.identifyStrengths(testDeck, results);
        const weaknesses = this.identifyWeaknesses(testDeck, results);
        const recommendations = this.generateRecommendations(testDeck, results);

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

    private classifyPerformance(winRate: number): 'excellent' | 'good' | 'average' | 'poor' {
        if (winRate >= 0.65) return 'excellent';
        if (winRate >= 0.55) return 'good';
        if (winRate >= 0.45) return 'average';
        return 'poor';
    }

    private calculateFavorability(winRate: number): MatchupAnalysis['favorability'] {
        if (winRate >= 0.65) return 'heavily_favored';
        if (winRate >= 0.55) return 'favored';
        if (winRate >= 0.45) return 'even';
        if (winRate >= 0.35) return 'unfavored';
        return 'heavily_unfavored';
    }

    private identifyStrengths(deck: Card[], results: BatchResult[]): string[] {
        const strengths: string[] = [];
        
        // Analyze card types
        const units = deck.filter(c => c.type.toLowerCase() === 'unit' || c.type.toLowerCase() === 'minion');
        const spells = deck.filter(c => c.type.toLowerCase() === 'spell');
        const sites = deck.filter(c => c.type.toLowerCase() === 'site');

        if (units.length >= deck.length * 0.4) {
            strengths.push('Strong board presence');
        }
        
        if (spells.length >= deck.length * 0.3) {
            strengths.push('Good spell support');
        }

        // Analyze mana curve
        const avgCost = deck.reduce((sum, c) => sum + (c.cost || 0), 0) / deck.length;
        if (avgCost <= 3) {
            strengths.push('Fast aggressive pressure');
        } else if (avgCost >= 5) {
            strengths.push('Powerful late game');
        }

        // Analyze win rate patterns
        const fastWins = results.filter(r => r.averageTurns <= 8).length;
        if (fastWins >= results.length * 0.3) {
            strengths.push('Consistent early game');
        }

        return strengths;
    }

    private identifyWeaknesses(deck: Card[], results: BatchResult[]): string[] {
        const weaknesses: string[] = [];

        // Check for common weaknesses
        const lowWinRateResults = results.filter(r => r.player1WinRate < 0.4);
        if (lowWinRateResults.length >= results.length * 0.3) {
            weaknesses.push('Inconsistent performance');
        }

        const longGames = results.filter(r => r.averageTurns >= 15).length;
        if (longGames >= results.length * 0.4) {
            weaknesses.push('Slow to close out games');
        }

        // Analyze deck composition
        const units = deck.filter(c => c.type.toLowerCase() === 'unit' || c.type.toLowerCase() === 'minion');
        if (units.length < deck.length * 0.2) {
            weaknesses.push('Lacks board presence');
        }

        const avgCost = deck.reduce((sum, c) => sum + (c.cost || 0), 0) / deck.length;
        if (avgCost >= 6) {
            weaknesses.push('High mana curve may cause slow starts');
        }

        return weaknesses;
    }

    private generateRecommendations(deck: Card[], results: BatchResult[]): string[] {
        const recommendations: string[] = [];

        const avgWinRate = results.reduce((sum, r) => sum + r.player1WinRate, 0) / results.length;
        
        if (avgWinRate < 0.5) {
            recommendations.push('Consider adding more efficient cards');
            recommendations.push('Review mana curve for better consistency');
        }

        const units = deck.filter(c => c.type.toLowerCase() === 'unit' || c.type.toLowerCase() === 'minion');
        const spells = deck.filter(c => c.type.toLowerCase() === 'spell');

        if (units.length < spells.length) {
            recommendations.push('Consider adding more units for board presence');
        }

        const highCostCards = deck.filter(c => (c.cost || 0) >= 6).length;
        if (highCostCards >= deck.length * 0.3) {
            recommendations.push('Consider reducing high-cost cards for better early game');
        }

        return recommendations;
    }

    private identifyMatchupFactors(result: BatchResult): string[] {
        const factors: string[] = [];

        if (result.averageTurns <= 8) {
            factors.push('Fast-paced matchup');
        } else if (result.averageTurns >= 15) {
            factors.push('Control-oriented matchup');
        }

        if (result.winReasons.life >= result.totalGames * 0.7) {
            factors.push('Damage race is critical');
        }

        if (result.winReasons.timeout >= result.totalGames * 0.2) {
            factors.push('Games tend to go long');
        }

        return factors;
    }

    private analyzeConsistency(result: BatchResult): ConsistencyReport {
        // Calculate win rate variance
        const winRates = result.detailedResults.map(r => r.winner === 'player1' ? 1 : 0);
        const variance = this.calculateVariance(winRates);
        
        const turnVariance = this.calculateVariance(result.detailedResults.map(r => r.turns));
        
        return {
            winRateVariance: variance,
            turnVariance,
            consistencyScore: Math.max(0, 1 - (variance * 2)), // Higher is more consistent
            recommendations: this.generateConsistencyRecommendations(variance, turnVariance)
        };
    }

    private calculateVariance(values: number[]): number {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        return variance;
    }

    private generateConsistencyRecommendations(winVariance: number, turnVariance: number): string[] {
        const recommendations: string[] = [];

        if (winVariance > 0.3) {
            recommendations.push('High win rate variance - consider more consistent cards');
        }

        if (turnVariance > 25) {
            recommendations.push('Game length varies significantly - review win conditions');
        }

        return recommendations;
    }

    private createBaselineDeck(): Card[] {
        // Create a balanced baseline deck for testing
        // This would be replaced with actual card data
        return Array(40).fill(null).map((_, i) => ({
            id: `baseline_${i}`,
            name: `Baseline Card ${i}`,
            type: i % 3 === 0 ? 'Unit' : i % 3 === 1 ? 'Spell' : 'Site',
            cost: Math.floor(i / 8) + 1,
            power: i % 3 === 0 ? Math.floor(i / 10) + 1 : undefined,
            life: i % 3 === 0 ? Math.floor(i / 10) + 1 : undefined,
            elements: ['air'],
            rarity: 'Common',
            text: 'Baseline test card'
        }));
    }

    private getMetaDecks(): { name: string; cards: Card[] }[] {
        // Return a set of representative meta decks
        // This would be replaced with actual meta deck data
        return [
            { name: 'Aggro Fire', cards: this.createTestDeck('fire', 'aggro') },
            { name: 'Control Water', cards: this.createTestDeck('water', 'control') },
            { name: 'Midrange Earth', cards: this.createTestDeck('earth', 'midrange') },
            { name: 'Combo Air', cards: this.createTestDeck('air', 'combo') }
        ];
    }

    private createTestDeck(element: string, archetype: string): Card[] {
        // Create test decks for different archetypes
        const baseCost = archetype === 'aggro' ? 2 : archetype === 'control' ? 5 : 3;
        
        return Array(40).fill(null).map((_, i) => ({
            id: `${element}_${archetype}_${i}`,
            name: `${element} ${archetype} Card ${i}`,
            type: i % 3 === 0 ? 'Unit' : i % 3 === 1 ? 'Spell' : 'Site',
            cost: baseCost + Math.floor(i / 10),
            power: i % 3 === 0 ? baseCost + Math.floor(i / 15) : undefined,
            life: i % 3 === 0 ? baseCost + Math.floor(i / 15) : undefined,
            elements: [element],
            rarity: 'Common',
            text: `${archetype} ${element} card`
        }));
    }

    private makeRandomSubstitution(deck: Card[], cardPool: Card[]): Card[] {
        const newDeck = [...deck];
        const removeIndex = Math.floor(Math.random() * newDeck.length);
        const addCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        
        newDeck[removeIndex] = addCard;
        return newDeck;
    }

    private identifyChanges(originalDeck: Card[], optimizedDeck: Card[]): string[] {
        const changes: string[] = [];
        
        for (let i = 0; i < originalDeck.length; i++) {
            if (originalDeck[i].id !== optimizedDeck[i].id) {
                changes.push(`Replaced ${originalDeck[i].name} with ${optimizedDeck[i].name}`);
            }
        }
        
        return changes;
    }

    private analyzeDeckComposition(deck: Card[]): DeckComposition {
        const units = deck.filter(c => c.type.toLowerCase() === 'unit' || c.type.toLowerCase() === 'minion');
        const spells = deck.filter(c => c.type.toLowerCase() === 'spell');
        const sites = deck.filter(c => c.type.toLowerCase() === 'site');

        const elements = {
            air: deck.filter(c => c.elements?.includes('air')).length,
            earth: deck.filter(c => c.elements?.includes('earth')).length,
            fire: deck.filter(c => c.elements?.includes('fire')).length,
            water: deck.filter(c => c.elements?.includes('water')).length
        };

        const manaCurve = Array(10).fill(0);
        deck.forEach(card => {
            const cost = Math.min(9, card.cost || 0);
            manaCurve[cost]++;
        });

        return {
            units: units.length,
            spells: spells.length,
            sites: sites.length,
            elements,
            manaCurve,
            averageCost: deck.reduce((sum, c) => sum + (c.cost || 0), 0) / deck.length
        };
    }

    private calculateOverallRating(metaTest: DeckTestResult, consistency: ConsistencyReport): number {
        const winRateScore = metaTest.winRate * 40;
        const consistencyScore = consistency.consistencyScore * 30;
        const performanceScore = metaTest.performance === 'excellent' ? 30 :
                                metaTest.performance === 'good' ? 20 :
                                metaTest.performance === 'average' ? 10 : 0;
        
        return Math.min(100, winRateScore + consistencyScore + performanceScore);
    }
}

// Interfaces for test results
export interface ConsistencyReport {
    winRateVariance: number;
    turnVariance: number;
    consistencyScore: number;
    recommendations: string[];
}

export interface DeckOptimizationResult {
    originalDeck: Card[];
    optimizedDeck: Card[];
    improvement: number;
    finalWinRate: number;
    changes: string[];
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
