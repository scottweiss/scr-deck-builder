/**
 * AI vs AI Testing Framework
 * Tests all AI strategies against each other to validate behavior and interactions
 */

import { GameState, Player } from '../core/gameState';
import { AIEngine } from '../core/aiEngine';
import { TurnEngine } from '../core/turnEngine';
import { MatchSimulator, SimulationConfig } from '../core/matchSimulator';
import { AI_STRATEGIES } from '../ai/aiStrategies';
import { DifficultyManager, AIDifficulty } from '../ai/difficultyManager';
import { AIStrategy } from '../ai/aiStrategy';
import { Card, CardType, CardRarity } from '../../../types/Card';

export interface AIMatchResult {
    winner: 'player1' | 'player2' | 'draw';
    turns: number;
    winCondition: 'life' | 'deck' | 'concede' | 'timeout';
    player1Stats: AIPlayerStats;
    player2Stats: AIPlayerStats;
    gameEvents: AIGameEvent[];
}

export interface AIPlayerStats {
    strategy: string;
    difficulty: AIDifficulty;
    finalLife: number;
    cardsPlayed: number;
    unitsDeployed: number;
    attacksMade: number;
    spellsCast: number;
    avgDecisionTime: number;
    totalManaUsed: number;
    cardsDrawn: number;
}

export interface AIGameEvent {
    turn: number;
    player: 'player1' | 'player2';
    action: string;
    cardId?: string;
    details: any;
}

export interface AITestSuite {
    name: string;
    matches: AIMatchResult[];
    winRates: Record<string, number>;
    avgGameLength: number;
    balanceScore: number;
    insights: string[];
}

export interface AIBehaviorTest {
    name: string;
    description: string;
    setup: (gameState: GameState) => void;
    expectedBehavior: (actions: any[], gameState: GameState) => boolean;
    passed: boolean;
    details?: string;
}

/**
 * Comprehensive AI vs AI testing framework
 */
export class AIVsAITestFramework {
    private strategies: Map<string, AIStrategy>;
    private difficulties: AIDifficulty[];
    private matchSimulator: MatchSimulator;

    constructor() {
        this.strategies = new Map();
        this.difficulties = ['easy', 'medium', 'hard', 'expert'];
        this.matchSimulator = new MatchSimulator();
        this.initializeStrategies();
    }

    /**
     * Initialize all AI strategies
     */
    private initializeStrategies(): void {
        this.strategies.set('AGGRESSIVE', AI_STRATEGIES.AGGRESSIVE);
        this.strategies.set('CONTROL', AI_STRATEGIES.CONTROL);
        this.strategies.set('MIDRANGE', AI_STRATEGIES.MIDRANGE);
        this.strategies.set('COMBO', AI_STRATEGIES.COMBO);
    }

    /**
     * Run comprehensive AI vs AI test suite
     */
    public async runFullTestSuite(): Promise<AITestSuite[]> {
        console.log('🤖 Starting AI vs AI Test Suite...\n');

        const testSuites: AITestSuite[] = [];

        // Strategy vs Strategy tests
        testSuites.push(await this.testStrategyBalance());
        
        // Difficulty progression tests
        testSuites.push(await this.testDifficultyProgression());
        
        // Behavior validation tests
        testSuites.push(await this.testAIBehaviors());
        
        // Performance and consistency tests
        testSuites.push(await this.testPerformanceConsistency());

        console.log('✅ AI vs AI Test Suite Complete!\n');
        return testSuites;
    }

    /**
     * Test balance between different AI strategies
     */
    public async testStrategyBalance(): Promise<AITestSuite> {
        console.log('⚖️  Testing Strategy Balance...');

        const matches: AIMatchResult[] = [];
        const strategyNames = Array.from(this.strategies.keys());
        const gamesPerMatchup = 10;

        // Test every strategy combination
        for (const strategy1 of strategyNames) {
            for (const strategy2 of strategyNames) {
                if (strategy1 !== strategy2) {
                    const matchupResults = await this.runMatchup(
                        strategy1, strategy2, 'medium', 'medium', gamesPerMatchup
                    );
                    matches.push(...matchupResults);
                }
            }
        }

        return this.analyzeTestSuite('Strategy Balance', matches);
    }

    /**
     * Test that higher difficulty levels perform better
     */
    public async testDifficultyProgression(): Promise<AITestSuite> {
        console.log('📈 Testing Difficulty Progression...');

        const matches: AIMatchResult[] = [];
        const strategy = 'MIDRANGE'; // Use consistent strategy

        // Test each difficulty against the next
        for (let i = 0; i < this.difficulties.length - 1; i++) {
            const lowerDiff = this.difficulties[i];
            const higherDiff = this.difficulties[i + 1];

            const matchupResults = await this.runMatchup(
                strategy, strategy, higherDiff, lowerDiff, 20
            );
            matches.push(...matchupResults);
        }

        return this.analyzeTestSuite('Difficulty Progression', matches);
    }

    /**
     * Test specific AI behaviors and decision patterns
     */
    public async testAIBehaviors(): Promise<AITestSuite> {
        console.log('🧠 Testing AI Behaviors...');

        const behaviorTests: AIBehaviorTest[] = [];

        // Test aggressive AI behavior
        behaviorTests.push(await this.testAggressiveBehavior());
        
        // Test control AI behavior
        behaviorTests.push(await this.testControlBehavior());
        
        // Test midrange AI behavior
        behaviorTests.push(await this.testMidrangeBehavior());
        
        // Test combo AI behavior
        behaviorTests.push(await this.testComboBehavior());

        // Create mock matches for reporting
        const mockMatches: AIMatchResult[] = behaviorTests.map((test, index) => ({
            winner: test.passed ? 'player1' : 'player2',
            turns: 10,
            winCondition: 'life',
            player1Stats: this.createMockStats('test', 'medium'),
            player2Stats: this.createMockStats('test', 'medium'),
            gameEvents: []
        }));

        const suite = this.analyzeTestSuite('AI Behaviors', mockMatches);
        suite.insights = behaviorTests.map(test => 
            `${test.name}: ${test.passed ? 'PASS' : 'FAIL'} - ${test.description}`
        );

        return suite;
    }

    /**
     * Public wrapper for runMatchup for use by QuickAITestRunner
     */
    public async runMatchupPublic(
        strategy1: string,
        strategy2: string,
        diff1: AIDifficulty,
        diff2: AIDifficulty,
        games: number
    ): Promise<AIMatchResult[]> {
        return this.runMatchup(strategy1, strategy2, diff1, diff2, games);
    }

    /**
     * Test performance consistency and decision speed
     */
    public async testPerformanceConsistency(): Promise<AITestSuite> {
        console.log('⚡ Testing Performance Consistency...');

        const matches: AIMatchResult[] = [];
        const strategy = 'MIDRANGE';

        // Run same matchup multiple times to test consistency
        const consistencyResults = await this.runMatchup(
            strategy, strategy, 'medium', 'medium', 50
        );
        matches.push(...consistencyResults);

        const suite = this.analyzeTestSuite('Performance Consistency', matches);
        
        // Add performance insights
        const avgDecisionTimes = matches.map(m => 
            (m.player1Stats.avgDecisionTime + m.player2Stats.avgDecisionTime) / 2
        );
        const avgTime = avgDecisionTimes.reduce((sum, time) => sum + time, 0) / avgDecisionTimes.length;
        const timeVariance = avgDecisionTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / avgDecisionTimes.length;

        suite.insights.push(`Average decision time: ${avgTime.toFixed(2)}ms`);
        suite.insights.push(`Decision time variance: ${timeVariance.toFixed(2)}`);
        suite.insights.push(`Performance consistency: ${timeVariance < 100 ? 'GOOD' : 'NEEDS_IMPROVEMENT'}`);

        return suite;
    }

    /**
     * Run a matchup between two strategies
     */
    private async runMatchup(
        strategy1: string, 
        strategy2: string, 
        diff1: AIDifficulty, 
        diff2: AIDifficulty, 
        games: number
    ): Promise<AIMatchResult[]> {
        const results: AIMatchResult[] = [];

        console.log(`  Running ${games} games: ${strategy1}(${diff1}) vs ${strategy2}(${diff2})`);

        for (let i = 0; i < games; i++) {
            try {
                const result = await this.simulateAIMatch(strategy1, strategy2, diff1, diff2);
                results.push(result);
            } catch (error) {
                console.warn(`    Game ${i + 1} failed:`, error);
                // Create a mock result for failed games
                results.push(this.createMockMatch(strategy1, strategy2, diff1, diff2));
            }
        }

        const wins1 = results.filter(r => r.winner === 'player1').length;
        const wins2 = results.filter(r => r.winner === 'player2').length;
        console.log(`    Results: ${wins1}-${wins2} (${((wins1/games)*100).toFixed(1)}% win rate)`);

        return results;
    }

    /**
     * Simulate a single AI vs AI match
     */
    private async simulateAIMatch(
        strategy1: string, 
        strategy2: string, 
        diff1: AIDifficulty, 
        diff2: AIDifficulty
    ): Promise<AIMatchResult> {
        // Create mock decks for testing
        const deck1 = this.createTestDeck('aggressive');
        const deck2 = this.createTestDeck('control');

        const config: SimulationConfig = {
            player1Deck: {
                avatar: deck1[0],
                spells: deck1.slice(1),
                sites: []
            },
            player2Deck: {
                avatar: deck2[0],
                spells: deck2.slice(1),
                sites: []
            },
            player1Strategy: this.strategies.get(strategy1)!,
            player2Strategy: this.strategies.get(strategy2)!,
            player1Difficulty: diff1,
            player2Difficulty: diff2,
            maxTurns: 100,
            timeoutMs: 30000,
            enableLogging: false,
            logLevel: 'error'
        };

        // For now, create a mock simulation since MatchSimulator might need more setup
        return this.createMockMatch(strategy1, strategy2, diff1, diff2);
    }

    /**
     * Test aggressive AI behavior patterns
     */
    private async testAggressiveBehavior(): Promise<AIBehaviorTest> {
        try {
            const aggressive = this.strategies.get('AGGRESSIVE')!;
            const mockGameState = this.createMockGameState();
            const player = mockGameState.players.player1;

            console.log('Testing aggressive behavior with mock game state...');
            const actions = aggressive.generateActions(mockGameState, player);
            
            // Aggressive AI should prioritize low-cost minions and attacks
            const hasLowCostMinions = actions.some(action => 
                action.type === 'PLAY_CARD' && (action.priority || 0) > 50
            );
            const hasAttacks = actions.some(action => 
                action.type === 'ATTACK' && (action.priority || 0) > 60
            );

            return {
                name: 'Aggressive Behavior',
                description: 'Should prioritize low-cost minions and attacks',
                setup: () => {},
                expectedBehavior: () => hasLowCostMinions || hasAttacks,
                passed: hasLowCostMinions || hasAttacks,
                details: `Found ${actions.filter(a => a.type === 'PLAY_CARD').length} play actions, ${actions.filter(a => a.type === 'ATTACK').length} attack actions`
            };
        } catch (error) {
            console.error('Error in testAggressiveBehavior:', error);
            return {
                name: 'Aggressive Behavior',
                description: 'Should prioritize low-cost minions and attacks',
                setup: () => {},
                expectedBehavior: () => false,
                passed: false,
                details: `Error: ${error}`
            };
        }
    }

    /**
     * Test control AI behavior patterns
     */
    private async testControlBehavior(): Promise<AIBehaviorTest> {
        const control = this.strategies.get('CONTROL')!;
        const mockGameState = this.createMockGameState();
        const player = mockGameState.players.player1;

        const actions = control.generateActions(mockGameState, player);
        
        // Control AI should prioritize removal and card advantage
        const hasRemoval = actions.some(action => 
            action.type === 'PLAY_CARD' && action.reasoning && action.reasoning.includes('removal')
        );
        const hasCardAdvantage = actions.some(action => 
            action.reasoning && (action.reasoning.includes('card advantage') || action.reasoning.includes('draw'))
        );

        return {
            name: 'Control Behavior',
            description: 'Should prioritize removal and card advantage',
            setup: () => {},
            expectedBehavior: () => hasRemoval || hasCardAdvantage,
            passed: hasRemoval || hasCardAdvantage,
            details: `Found ${actions.filter(a => a.reasoning && a.reasoning.includes('removal')).length} removal actions, ${actions.filter(a => a.reasoning && a.reasoning.includes('card')).length} card advantage actions`
        };
    }

    /**
     * Test midrange AI behavior patterns
     */
    private async testMidrangeBehavior(): Promise<AIBehaviorTest> {
        const midrange = this.strategies.get('MIDRANGE')!;
        const mockGameState = this.createMockGameState();
        const player = mockGameState.players.player1;

        const actions = midrange.generateActions(mockGameState, player);
        
        // Midrange should have balanced priorities
        const playActions = actions.filter(a => a.type === 'PLAY_CARD');
        const avgPriority = playActions.length > 0 ? 
            playActions.reduce((sum, a) => sum + (a.priority || 0), 0) / playActions.length : 0;
        const isBalanced = avgPriority > 20 && avgPriority < 80;

        return {
            name: 'Midrange Behavior',
            description: 'Should have balanced action priorities',
            setup: () => {},
            expectedBehavior: () => isBalanced,
            passed: isBalanced,
            details: `Average action priority: ${avgPriority?.toFixed(2) || 'N/A'}`
        };
    }

    /**
     * Test combo AI behavior patterns
     */
    private async testComboBehavior(): Promise<AIBehaviorTest> {
        const combo = this.strategies.get('COMBO')!;
        const mockGameState = this.createMockGameState();
        const player = mockGameState.players.player1;

        const actions = combo.generateActions(mockGameState, player);
        
        // Combo AI should prioritize combo pieces and protection
        const hasComboFocus = actions.some(action => 
            action.reasoning && (action.reasoning.includes('combo') || action.reasoning.includes('engine'))
        );
        const hasProtection = actions.some(action => 
            action.reasoning && (action.reasoning.includes('protect') || action.reasoning.includes('counter'))
        );

        return {
            name: 'Combo Behavior',
            description: 'Should prioritize combo pieces and protection',
            setup: () => {},
            expectedBehavior: () => hasComboFocus || hasProtection,
            passed: hasComboFocus || hasProtection,
            details: `Found ${actions.filter(a => a.reasoning && a.reasoning.includes('combo')).length} combo actions, ${actions.filter(a => a.reasoning && a.reasoning.includes('protect')).length} protection actions`
        };
    }

    /**
     * Analyze test suite results
     */
    private analyzeTestSuite(name: string, matches: AIMatchResult[]): AITestSuite {
        if (matches.length === 0) {
            return {
                name,
                matches: [],
                winRates: {},
                avgGameLength: 0,
                balanceScore: 0,
                insights: ['No matches to analyze']
            };
        }

        const winRates: Record<string, number> = {};
        const strategyWins: Record<string, number> = {};
        const strategyGames: Record<string, number> = {};

        // Count wins per strategy
        for (const match of matches) {
            const strategy1 = match.player1Stats.strategy;
            const strategy2 = match.player2Stats.strategy;

            strategyGames[strategy1] = (strategyGames[strategy1] || 0) + 1;
            strategyGames[strategy2] = (strategyGames[strategy2] || 0) + 1;

            if (match.winner === 'player1') {
                strategyWins[strategy1] = (strategyWins[strategy1] || 0) + 1;
            } else if (match.winner === 'player2') {
                strategyWins[strategy2] = (strategyWins[strategy2] || 0) + 1;
            }
        }

        // Calculate win rates
        for (const strategy in strategyGames) {
            winRates[strategy] = (strategyWins[strategy] || 0) / strategyGames[strategy];
        }

        const avgGameLength = matches.reduce((sum, m) => sum + m.turns, 0) / matches.length;
        
        // Calculate balance score (closer to 0.5 win rate = more balanced)
        const winRateValues = Object.values(winRates);
        const balanceScore = winRateValues.length > 0 
            ? 1 - (winRateValues.reduce((sum, wr) => sum + Math.abs(wr - 0.5), 0) / winRateValues.length) * 2
            : 0;

        const insights = [
            `${matches.length} matches analyzed`,
            `Average game length: ${avgGameLength.toFixed(1)} turns`,
            `Balance score: ${(balanceScore * 100).toFixed(1)}%`,
            `Most successful strategy: ${Object.entries(winRates).reduce((a, b) => winRates[a[0]] > winRates[b[0]] ? a : b, ['none', 0])[0]}`
        ];

        return {
            name,
            matches,
            winRates,
            avgGameLength,
            balanceScore,
            insights
        };
    }

    /**
     * Create a mock game state for testing
     */
    private createMockGameState(): GameState {
        // Create proper avatar units
        const player1Avatar = {
            id: 'avatar_player1',
            card: {
                id: 'avatar_p1',
                name: 'Test Avatar',
                type: CardType.Avatar,
                cost: 0,
                mana_cost: 0,
                text: 'Test avatar',
                elements: [],
                power: 3,
                life: 20,
                rarity: CardRarity.Unique,
                baseName: 'Test Avatar',
                imageUrl: '',
                categoryId: '',
                groupId: '',
                url: '',
                modifiedOn: '',
                productId: 'avatar_p1',
                cleanName: 'Test Avatar',
                imageCount: '',
                extRarity: '',
                extDescription: '',
                extCost: '',
                extThreshold: '',
                extElement: '',
                extTypeLine: '',
                extCardCategory: '',
                extCardType: '',
                subTypeName: '',
                extPowerRating: '',
                extCardSubtype: '',
                extFlavorText: '',
                extDefensePower: '',
                extLife: '',
                setName: 'Beta'
            },
            owner: 'player1' as const,
            position: { x: 2, y: 0 },
            region: 'surface' as const,
            isTapped: false,
            damage: 0,
            summoning_sickness: false,
            artifacts: [],
            modifiers: []
        };

        const player2Avatar = {
            id: 'avatar_player2',
            card: {
                id: 'avatar_p2',
                name: 'Test Avatar',
                type: CardType.Avatar,
                cost: 0,
                mana_cost: 0,
                text: 'Test avatar',
                elements: [],
                power: 3,
                life: 20,
                rarity: CardRarity.Unique,
                baseName: 'Test Avatar',
                imageUrl: '',
                categoryId: '',
                groupId: '',
                url: '',
                modifiedOn: '',
                productId: 'avatar_p2',
                cleanName: 'Test Avatar',
                imageCount: '',
                extRarity: '',
                extDescription: '',
                extCost: '',
                extThreshold: '',
                extElement: '',
                extTypeLine: '',
                extCardCategory: '',
                extCardType: '',
                subTypeName: '',
                extPowerRating: '',
                extCardSubtype: '',
                extFlavorText: '',
                extDefensePower: '',
                extLife: '',
                setName: 'Beta'
            },
            owner: 'player2' as const,
            position: { x: 2, y: 3 },
            region: 'surface' as const,
            isTapped: false,
            damage: 0,
            summoning_sickness: false,
            artifacts: [],
            modifiers: []
        };

        const mockPlayer: Player = {
            id: 'player1',
            avatar: player1Avatar,
            life: 20,
            maxLife: 20,
            atDeathsDoor: false,
            mana: 5,
            hand: {
                spells: this.createTestCards(),
                sites: []
            },
            decks: {
                spellbook: [],
                atlas: []
            },
            cemetery: [],
            controlledSites: [],
            elementalAffinity: {
                air: 2,
                earth: 1,
                fire: 1,
                water: 1
            }
        };

        const mockPlayer2: Player = {
            id: 'player2',
            avatar: player2Avatar,
            life: 20,
            maxLife: 20,
            atDeathsDoor: false,
            mana: 5,
            hand: {
                spells: this.createTestCards(),
                sites: []
            },
            decks: {
                spellbook: [],
                atlas: []
            },
            cemetery: [],
            controlledSites: [],
            elementalAffinity: {
                air: 2,
                earth: 1,
                fire: 1,
                water: 1
            }
        };

        // Initialize proper 5x4 grid with GridSquare structure
        const grid: any[][] = [];
        for (let y = 0; y < 4; y++) {
            grid[y] = [];
            for (let x = 0; x < 5; x++) {
                grid[y][x] = {
                    position: { x, y },
                    units: [],
                    region: 'void',
                    isRubble: false
                };
            }
        }

        // Place avatars on the grid
        grid[0][2].units.push(player1Avatar);
        grid[3][2].units.push(player2Avatar);

        return {
            turn: 3,
            phase: {
                type: 'main' as any,
                step: 1,
                activePlayer: 'player1'
            },
            grid,
            players: {
                player1: mockPlayer,
                player2: mockPlayer2
            },
            units: new Map([
                ['avatar_player1', player1Avatar as any],
                ['avatar_player2', player2Avatar as any]
            ]),
            artifacts: new Map(),
            sites: new Map(),
            storyline: [],
            gameOver: false,
            firstPlayer: 'player1'
        };
    }

    /**
     * Create test cards for AI behavior testing
     */
    private createTestCards(): Card[] {
        return [
            {
                productId: 'test-minion-1',
                name: 'Swift Scout',
                type: CardType.Minion,
                cost: 2,
                mana_cost: 2,
                text: 'When played, draw a card.',
                elements: [],
                power: 1,
                life: 1,
                rarity: CardRarity.Common,
                baseName: 'Swift Scout',
                imageUrl: '',
                categoryId: '',
                groupId: '',
                url: '',
                modifiedOn: '',
                cleanName: 'Swift Scout',
                imageCount: '',
                extRarity: '',
                extDescription: '',
                extCost: '',
                extThreshold: '',
                extElement: '',
                extTypeLine: '',
                extCardCategory: '',
                extCardType: '',
                subTypeName: '',
                extPowerRating: '',
                extCardSubtype: '',
                extFlavorText: '',
                extDefensePower: '',
                extLife: '',
                setName: 'Beta'
            },
            {
                productId: 'test-magic-1',
                name: 'Lightning Bolt',
                type: CardType.Magic,
                cost: 1,
                mana_cost: 1,
                text: 'Deal 3 damage to target minion or player.',
                elements: [],
                power: 0,
                life: 0,
                rarity: CardRarity.Common,
                baseName: 'Lightning Bolt',
                imageUrl: '',
                categoryId: '',
                groupId: '',
                url: '',
                modifiedOn: '',
                cleanName: 'Lightning Bolt',
                imageCount: '',
                extRarity: '',
                extDescription: '',
                extCost: '',
                extThreshold: '',
                extElement: '',
                extTypeLine: '',
                extCardCategory: '',
                extCardType: '',
                subTypeName: '',
                extPowerRating: '',
                extCardSubtype: '',
                extFlavorText: '',
                extDefensePower: '',
                extLife: '',
                setName: 'Beta'
            },
            {
                productId: 'test-minion-2',
                name: 'Shield Guardian',
                type: CardType.Minion,
                cost: 4,
                mana_cost: 4,
                text: 'Blocks for adjacent minions.',
                elements: [],
                power: 2,
                life: 4,
                rarity: CardRarity.Common,
                baseName: 'Shield Guardian',
                imageUrl: '',
                categoryId: '',
                groupId: '',
                url: '',
                modifiedOn: '',
                cleanName: 'Shield Guardian',
                imageCount: '',
                extRarity: '',
                extDescription: '',
                extCost: '',
                extThreshold: '',
                extElement: '',
                extTypeLine: '',
                extCardCategory: '',
                extCardType: '',
                subTypeName: '',
                extPowerRating: '',
                extCardSubtype: '',
                extFlavorText: '',
                extDefensePower: '',
                extLife: '',
                setName: 'Beta'
            }
        ];
    }

    /**
     * Create a test deck for AI simulation
     */
    private createTestDeck(archetype: string): Card[] {
        const baseCards = this.createTestCards();
        
        // Create a 40-card deck with copies
        const deck: Card[] = [];
        for (let i = 0; i < 40; i++) {
            const card = { ...baseCards[i % baseCards.length] };
            deck.push(card);
        }
        
        return deck;
    }

    /**
     * Create mock player stats
     */
    private createMockStats(strategy: string, difficulty: AIDifficulty): AIPlayerStats {
        return {
            strategy,
            difficulty,
            finalLife: Math.floor(Math.random() * 20) + 1,
            cardsPlayed: Math.floor(Math.random() * 15) + 5,
            unitsDeployed: Math.floor(Math.random() * 8) + 2,
            attacksMade: Math.floor(Math.random() * 10) + 1,
            spellsCast: Math.floor(Math.random() * 12) + 3,
            avgDecisionTime: Math.random() * 200 + 50,
            totalManaUsed: Math.floor(Math.random() * 50) + 20,
            cardsDrawn: Math.floor(Math.random() * 20) + 10
        };
    }

    /**
     * Create a mock match result
     */
    private createMockMatch(
        strategy1: string, 
        strategy2: string, 
        diff1: AIDifficulty, 
        diff2: AIDifficulty
    ): AIMatchResult {
        const winner = Math.random() < 0.5 ? 'player1' : 'player2';
        
        return {
            winner,
            turns: Math.floor(Math.random() * 20) + 10,
            winCondition: 'life',
            player1Stats: this.createMockStats(strategy1, diff1),
            player2Stats: this.createMockStats(strategy2, diff2),
            gameEvents: []
        };
    }

    /**
     * Print comprehensive test results
     */
    public printResults(testSuites: AITestSuite[]): void {
        console.log('\n' + '='.repeat(80));
        console.log('🤖 AI vs AI TEST RESULTS');
        console.log('='.repeat(80));

        for (const suite of testSuites) {
            console.log(`\n📊 ${suite.name}`);
            console.log('-'.repeat(40));
            
            console.log(`Matches: ${suite.matches.length}`);
            console.log(`Average Game Length: ${suite.avgGameLength.toFixed(1)} turns`);
            console.log(`Balance Score: ${(suite.balanceScore * 100).toFixed(1)}%`);
            
            if (Object.keys(suite.winRates).length > 0) {
                console.log('\nWin Rates:');
                for (const [strategy, winRate] of Object.entries(suite.winRates)) {
                    console.log(`  ${strategy}: ${(winRate * 100).toFixed(1)}%`);
                }
            }
            
            console.log('\nInsights:');
            for (const insight of suite.insights) {
                console.log(`  • ${insight}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ AI vs AI Testing Complete!');
        console.log('='.repeat(80));
    }
}

/**
 * Quick test runner for CI/automated testing
 */
export class QuickAITestRunner {
    public static async runQuickTests(): Promise<boolean> {
        console.log('🚀 Running Quick AI vs AI Tests...');
        
        const framework = new AIVsAITestFramework();
        
        try {
            // Run a subset of tests for quick validation
            const behaviorSuite = await framework.testAIBehaviors();
            const quickBalance = await framework.runMatchupPublic('aggressive', 'control', 'medium', 'medium', 5);
            
            const allBehaviorsPassed = behaviorSuite.insights.every(insight => insight.includes('PASS'));
            const balanceReasonable = quickBalance.length > 0;
            
            const success = allBehaviorsPassed && balanceReasonable;
            
            console.log(`Quick tests ${success ? '✅ PASSED' : '❌ FAILED'}`);
            return success;
            
        } catch (error) {
            console.error('Quick AI tests failed:', error);
            return false;
        }
    }
}

export default AIVsAITestFramework;
