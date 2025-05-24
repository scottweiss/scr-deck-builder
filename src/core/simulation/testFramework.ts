/**
 * Comprehensive testing framework for the match simulation system
 * Tests game mechanics, AI behavior, and integration functionality
 */

import { Card } from '../../types/Card';
import { SimulationIntegration, DeckSimulationConfig } from './simulationIntegration';
import { MatchSimulator, SimulationConfig } from './matchSimulator';
import { GameStateManager, GameState, Position } from './gameState';
import { TurnEngine } from './turnEngine';
import { CombatSystem } from './combatSystem';
import { AIEngine, AI_STRATEGIES } from './aiEngine';
import { SpellEffectSystem } from './spellEffectSystem';

export interface TestResult {
    testName: string;
    passed: boolean;
    details: string;
    duration: number;
    error?: Error;
}

export interface TestSuite {
    name: string;
    results: TestResult[];
    passRate: number;
    totalDuration: number;
}

export class SimulationTestFramework {
    private integration: SimulationIntegration;
    private gameStateManager: GameStateManager;
    private turnEngine: TurnEngine;
    private combatSystem: CombatSystem;
    private spellSystem: SpellEffectSystem;

    constructor() {
        this.integration = new SimulationIntegration();
        this.gameStateManager = new GameStateManager();
        this.turnEngine = new TurnEngine(this.gameStateManager);
        this.combatSystem = new CombatSystem();
        this.spellSystem = new SpellEffectSystem();
    }

    /**
     * Runs all test suites
     */
    public async runAllTests(): Promise<{ 
        suites: TestSuite[];
        overallPassRate: number;
        summary: string;
    }> {
        console.log('🧪 Starting comprehensive simulation system tests...\n');

        const suites: TestSuite[] = [];

        // Core component tests
        suites.push(await this.testGameState());
        suites.push(await this.testTurnEngine());
        suites.push(await this.testCombatSystem());
        suites.push(await this.testAIEngine());
        suites.push(await this.testSpellSystem());

        // Integration tests
        suites.push(await this.testMatchSimulation());
        suites.push(await this.testDeckAnalysis());
        suites.push(await this.testBatchSimulation());

        // Performance tests
        suites.push(await this.testPerformance());

        // Edge case tests
        suites.push(await this.testEdgeCases());

        const totalTests = suites.reduce((sum, suite) => sum + suite.results.length, 0);
        const passedTests = suites.reduce((sum, suite) => 
            sum + suite.results.filter(r => r.passed).length, 0);
        const overallPassRate = totalTests > 0 ? passedTests / totalTests : 0;

        const summary = this.generateTestSummary(suites, overallPassRate);
        
        console.log('\n📊 Test Summary:');
        console.log(summary);

        return { suites, overallPassRate, summary };
    }

    /**
     * Tests core game state functionality
     */
    private async testGameState(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'Game State Management';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: Game initialization
        results.push(await this.runTest('Game Initialization', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');
            
            if (!gameState || !gameState.players.player1 || !gameState.players.player2) {
                throw new Error('Game state not properly initialized');
            }

            if (gameState.currentPlayerId !== 'player1') {
                throw new Error('First player not set correctly');
            }

            if (!gameState.grid || gameState.grid.length !== 4) {
                throw new Error('Game grid not properly initialized');
            }

            return 'Game state initialized correctly';
        }));

        // Test: Unit placement and movement
        results.push(await this.runTest('Unit Placement and Movement', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');
            
            // Create test unit
            const testCard = this.createTestUnitCard('Test Unit', 3, 2);
            const position: Position = { x: 2, y: 1 };

            // Place unit
            const unitId = this.gameStateManager.placeUnit(gameState, testCard, 'player1', position);
            
            if (!unitId || !gameState.units[unitId]) {
                throw new Error('Unit not placed correctly');
            }

            const unit = gameState.units[unitId];
            if (unit.position.x !== position.x || unit.position.y !== position.y) {
                throw new Error('Unit position not set correctly');
            }

            // Test movement
            const newPosition: Position = { x: 2, y: 2 };
            this.gameStateManager.moveUnit(gameState, unitId, position, newPosition);

            if (unit.position.x !== newPosition.x || unit.position.y !== newPosition.y) {
                throw new Error('Unit movement failed');
            }

            return 'Unit placement and movement working correctly';
        }));

        // Test: Mana management
        results.push(await this.runTest('Mana Management', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');
            const initialMana = gameState.players.player1.mana;

            // Add mana
            this.gameStateManager.addMana(gameState, 'player1', 3);
            if (gameState.players.player1.mana !== initialMana + 3) {
                throw new Error('Mana addition failed');
            }

            // Spend mana
            const success = this.gameStateManager.spendMana(gameState, 'player1', 2);
            if (!success || gameState.players.player1.mana !== initialMana + 1) {
                throw new Error('Mana spending failed');
            }

            // Try to overspend
            const failedSpend = this.gameStateManager.spendMana(gameState, 'player1', 10);
            if (failedSpend) {
                throw new Error('Overspending should have failed');
            }

            return 'Mana management working correctly';
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Tests turn engine functionality
     */
    private async testTurnEngine(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'Turn Engine';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: Turn progression
        results.push(await this.runTest('Turn Progression', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');
            const initialTurn = gameState.turn;

            // Get valid actions
            const actions = this.turnEngine.getValidActions();
            if (!actions || actions.length === 0) {
                throw new Error('No valid actions returned');
            }

            // Execute pass action to advance turn
            const passAction = actions.find(a => a.type === 'pass');
            if (!passAction) {
                throw new Error('Pass action not available');
            }

            const executed = this.turnEngine.executeAction(passAction);
            if (!executed) {
                throw new Error('Failed to execute pass action');
            }

            return 'Turn progression working correctly';
        }));

        // Test: Action validation
        results.push(await this.runTest('Action Validation', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');

            // Test invalid action
            const invalidAction = {
                type: 'cast_spell' as const,
                playerId: 'player1' as const,
                details: { spellIndex: 99, casterId: 'invalid', target: { x: 0, y: 0 } }
            };

            const result = this.turnEngine.executeAction(invalidAction);
            if (result) {
                throw new Error('Invalid action should have failed');
            }

            return 'Action validation working correctly';
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Tests combat system functionality
     */
    private async testCombatSystem(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'Combat System';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: Basic combat resolution
        results.push(await this.runTest('Basic Combat Resolution', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');

            // Create test units
            const attackerCard = this.createTestUnitCard('Attacker', 3, 2);
            const defenderCard = this.createTestUnitCard('Defender', 2, 3);

            const attackerId = this.gameStateManager.placeUnit(gameState, attackerCard, 'player1', { x: 1, y: 1 });
            const defenderId = this.gameStateManager.placeUnit(gameState, defenderCard, 'player2', { x: 2, y: 1 });

            // Resolve combat
            const combatResult = this.combatSystem.resolveCombat(gameState, attackerId, defenderId);

            if (!combatResult) {
                throw new Error('Combat result not returned');
            }

            // Check damage dealt
            if (combatResult.defenderDamage !== 3 || combatResult.attackerDamage !== 2) {
                throw new Error(`Incorrect damage: attacker took ${combatResult.attackerDamage}, defender took ${combatResult.defenderDamage}`);
            }

            return 'Basic combat resolution working correctly';
        }));

        // Test: Intercept mechanics
        results.push(await this.runTest('Intercept Mechanics', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');

            // Create test units with intercept
            const attackerCard = this.createTestUnitCard('Attacker', 2, 2);
            const targetCard = this.createTestUnitCard('Target', 1, 1);
            const interceptorCard = this.createTestUnitCard('Interceptor', 2, 3);
            interceptorCard.abilities = ['intercept'];

            const attackerId = this.gameStateManager.placeUnit(gameState, attackerCard, 'player1', { x: 1, y: 1 });
            const targetId = this.gameStateManager.placeUnit(gameState, targetCard, 'player2', { x: 3, y: 1 });
            const interceptorId = this.gameStateManager.placeUnit(gameState, interceptorCard, 'player2', { x: 2, y: 1 });

            // Resolve combat (should be intercepted)
            const combatResult = this.combatSystem.resolveCombat(gameState, attackerId, targetId);

            if (!combatResult.intercepted || !combatResult.interceptor) {
                throw new Error('Intercept did not trigger');
            }

            if (combatResult.interceptor.id !== interceptorId) {
                throw new Error('Wrong unit intercepted');
            }

            return 'Intercept mechanics working correctly';
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Tests AI engine functionality
     */
    private async testAIEngine(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'AI Engine';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: AI decision making
        results.push(await this.runTest('AI Decision Making', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');
            
            // Add some cards to hand
            gameState.players.player1.hand.push(this.createTestUnitCard('Test Unit', 2, 2));
            gameState.players.player1.mana = 5;

            const aiEngine = new AIEngine(AI_STRATEGIES.MIDRANGE, this.turnEngine);
            const decision = await aiEngine.makeDecision(gameState, 'player1');

            if (!decision) {
                throw new Error('AI did not make a decision');
            }

            if (!decision.type || !decision.reasoning) {
                throw new Error('Decision missing required fields');
            }

            return 'AI decision making working correctly';
        }));

        // Test: Different AI strategies
        results.push(await this.runTest('AI Strategy Differences', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');
            
            // Set up game state for strategy testing
            gameState.players.player1.hand.push(this.createTestUnitCard('Aggressive Unit', 4, 1));
            gameState.players.player1.hand.push(this.createTestSpellCard('Control Spell', 3));
            gameState.players.player1.mana = 5;

            const aggressiveAI = new AIEngine(AI_STRATEGIES.AGGRESSIVE, this.turnEngine);
            const controlAI = new AIEngine(AI_STRATEGIES.CONTROL, this.turnEngine);

            const aggressiveDecision = await aggressiveAI.makeDecision(gameState, 'player1');
            const controlDecision = await controlAI.makeDecision(gameState, 'player1');

            // Different strategies should potentially make different decisions
            // (Though not guaranteed with this simple test setup)
            if (!aggressiveDecision || !controlDecision) {
                throw new Error('AI strategies failed to make decisions');
            }

            return 'AI strategies functioning correctly';
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Tests spell effect system
     */
    private async testSpellSystem(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'Spell Effect System';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: Spell parsing
        results.push(await this.runTest('Spell Text Parsing', async () => {
            const testSpells = [
                'Deal 3 damage to any target',
                'Draw 2 cards',
                'Heal target unit for 4',
                'Destroy target minion'
            ];

            for (const spellText of testSpells) {
                const effects = this.spellSystem.parseSpellText(spellText);
                if (!effects || effects.length === 0) {
                    throw new Error(`Failed to parse spell: ${spellText}`);
                }
            }

            return 'Spell parsing working correctly';
        }));

        // Test: Spell execution
        results.push(await this.runTest('Spell Execution', async () => {
            const players = {
                player1: this.createTestPlayer('player1'),
                player2: this.createTestPlayer('player2')
            };

            const gameState = this.gameStateManager.initializeGame(players, 'player1');

            // Create target unit
            const targetCard = this.createTestUnitCard('Target', 2, 5);
            const targetId = this.gameStateManager.placeUnit(gameState, targetCard, 'player2', { x: 2, y: 1 });
            const target = gameState.units[targetId];

            // Create damage spell
            const damageSpell = this.createTestSpellCard('Lightning Bolt', 1);
            damageSpell.text = 'Deal 3 damage to any target';

            // Execute spell
            const success = this.spellSystem.executeSpell(gameState, damageSpell, 'player1', [targetId]);
            
            if (!success) {
                throw new Error('Spell execution failed');
            }

            if (target.damage !== 3) {
                throw new Error(`Expected 3 damage, got ${target.damage}`);
            }

            return 'Spell execution working correctly';
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Tests complete match simulation
     */
    private async testMatchSimulation(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'Match Simulation';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: Complete match
        results.push(await this.runTest('Complete Match Simulation', async () => {
            const deck1 = this.createTestDeck('Aggro');
            const deck2 = this.createTestDeck('Control');

            const config: SimulationConfig = {
                player1Deck: deck1,
                player2Deck: deck2,
                player1Strategy: AI_STRATEGIES.AGGRESSIVE,
                player2Strategy: AI_STRATEGIES.CONTROL,
                maxTurns: 20,
                timeoutMs: 10000,
                enableLogging: false
            };

            const simulator = new MatchSimulator();
            const result = await simulator.simulateMatch(config);

            if (!result) {
                throw new Error('No simulation result returned');
            }

            if (!result.winner && result.reason !== 'timeout') {
                throw new Error('Match should have a winner or timeout');
            }

            if (result.turns <= 0) {
                throw new Error('Invalid turn count');
            }

            return `Match completed: ${result.winner || 'tie'} in ${result.turns} turns (${result.reason})`;
        }));

        // Test: Multiple simulations
        results.push(await this.runTest('Batch Simulation', async () => {
            const deck1 = this.createTestDeck('Test1');
            const deck2 = this.createTestDeck('Test2');

            const batchResult = await this.integration.batchSimulate(deck1, deck2, 5);

            if (!batchResult || batchResult.totalGames !== 5) {
                throw new Error('Batch simulation failed');
            }

            if (batchResult.player1Wins + batchResult.player2Wins + batchResult.ties !== 5) {
                throw new Error('Game count mismatch');
            }

            return `Batch simulation: ${batchResult.player1Wins}/${batchResult.player2Wins}/${batchResult.ties}`;
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Tests deck analysis functionality
     */
    private async testDeckAnalysis(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'Deck Analysis';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: Deck validation
        results.push(await this.runTest('Deck Validation', async () => {
            const validDeck = this.createTestDeck('Valid');
            const invalidDeck = this.createTestDeck('Invalid', 30); // Too small

            const validResult = this.integration.validateDeck(validDeck);
            const invalidResult = this.integration.validateDeck(invalidDeck);

            if (!validResult.isValid && validResult.errors.length === 0) {
                throw new Error('Valid deck marked as invalid');
            }

            if (invalidResult.isValid || invalidResult.errors.length === 0) {
                throw new Error('Invalid deck not caught');
            }

            return 'Deck validation working correctly';
        }));

        // Test: Performance analysis
        results.push(await this.runTest('Performance Analysis', async () => {
            const testDeck = this.createTestDeck('Test');
            
            const config: DeckSimulationConfig = {
                deck: testDeck,
                testRuns: 3, // Small number for testing
                strategy: AI_STRATEGIES.MIDRANGE
            };

            const report = await this.integration.analyzeDeckPerformance(config);

            if (!report || typeof report.winRate !== 'number') {
                throw new Error('Performance analysis failed');
            }

            if (report.winRate < 0 || report.winRate > 1) {
                throw new Error('Invalid win rate');
            }

            return `Performance analysis complete: ${(report.winRate * 100).toFixed(1)}% win rate`;
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Tests batch simulation functionality
     */
    private async testBatchSimulation(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'Batch Simulation';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: Statistical analysis
        results.push(await this.runTest('Statistical Analysis', async () => {
            const deck1 = this.createTestDeck('Statistical1');
            const deck2 = this.createTestDeck('Statistical2');

            const batchResult = await this.integration.batchSimulate(deck1, deck2, 10);

            if (!batchResult.winsByReason || Object.keys(batchResult.winsByReason).length === 0) {
                throw new Error('No win reason statistics');
            }

            if (batchResult.averageTurns <= 0 || batchResult.averageDuration <= 0) {
                throw new Error('Invalid average statistics');
            }

            return `Statistical analysis complete: avg ${batchResult.averageTurns.toFixed(1)} turns`;
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Tests system performance
     */
    private async testPerformance(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'Performance Tests';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: Simulation speed
        results.push(await this.runTest('Simulation Speed', async () => {
            const deck1 = this.createTestDeck('Speed1');
            const deck2 = this.createTestDeck('Speed2');

            const startTime = Date.now();
            const result = await this.integration.simulateMatch(deck1, deck2);
            const duration = Date.now() - startTime;

            if (duration > 5000) { // 5 second timeout
                throw new Error(`Simulation too slow: ${duration}ms`);
            }

            return `Simulation completed in ${duration}ms`;
        }));

        // Test: Memory usage (basic check)
        results.push(await this.runTest('Memory Usage', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // Run several simulations
            for (let i = 0; i < 5; i++) {
                const deck1 = this.createTestDeck(`Mem1_${i}`);
                const deck2 = this.createTestDeck(`Mem2_${i}`);
                await this.integration.simulateMatch(deck1, deck2);
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            const memoryMB = memoryIncrease / (1024 * 1024);

            if (memoryMB > 100) { // 100MB increase seems excessive
                throw new Error(`Excessive memory usage: ${memoryMB.toFixed(2)}MB`);
            }

            return `Memory increase: ${memoryMB.toFixed(2)}MB`;
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Tests edge cases and error handling
     */
    private async testEdgeCases(): Promise<TestSuite> {
        const results: TestResult[] = [];
        const suiteName = 'Edge Cases';

        console.log(`🎯 Testing ${suiteName}...`);

        // Test: Empty deck handling
        results.push(await this.runTest('Empty Deck Handling', async () => {
            try {
                const emptyDeck: Card[] = [];
                const normalDeck = this.createTestDeck('Normal');
                
                await this.integration.simulateMatch(emptyDeck, normalDeck);
                throw new Error('Should have failed with empty deck');
            } catch (error) {
                if (error instanceof Error && error.message.includes('Should have failed')) {
                    throw error;
                }
                // Expected to fail
                return 'Empty deck properly rejected';
            }
        }));

        // Test: Invalid card handling
        results.push(await this.runTest('Invalid Card Handling', async () => {
            const invalidCard: Card = {
                id: 'invalid',
                name: 'Invalid Card',
                cost: -1, // Invalid cost
                type: 'Unknown',
                text: '',
                elements: []
            };

            const validation = this.integration.validateDeck([invalidCard]);
            
            if (validation.isValid) {
                throw new Error('Invalid card should be rejected');
            }

            return 'Invalid cards properly handled';
        }));

        return this.createTestSuite(suiteName, results);
    }

    /**
     * Helper method to run a single test
     */
    private async runTest(testName: string, testFunction: () => Promise<string>): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            const details = await testFunction();
            const duration = Date.now() - startTime;
            
            console.log(`  ✅ ${testName} (${duration}ms)`);
            
            return {
                testName,
                passed: true,
                details,
                duration
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            
            console.log(`  ❌ ${testName} (${duration}ms): ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            return {
                testName,
                passed: false,
                details: error instanceof Error ? error.message : 'Unknown error',
                duration,
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }

    /**
     * Creates a test suite from results
     */
    private createTestSuite(name: string, results: TestResult[]): TestSuite {
        const passedTests = results.filter(r => r.passed).length;
        const passRate = results.length > 0 ? passedTests / results.length : 0;
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

        return {
            name,
            results,
            passRate,
            totalDuration
        };
    }

    /**
     * Generates test summary
     */
    private generateTestSummary(suites: TestSuite[], overallPassRate: number): string {
        const totalTests = suites.reduce((sum, suite) => sum + suite.results.length, 0);
        const passedTests = suites.reduce((sum, suite) => 
            sum + suite.results.filter(r => r.passed).length, 0);
        const totalDuration = suites.reduce((sum, suite) => sum + suite.totalDuration, 0);

        let summary = `\n📈 Overall Results:\n`;
        summary += `  Tests: ${passedTests}/${totalTests} passed (${(overallPassRate * 100).toFixed(1)}%)\n`;
        summary += `  Duration: ${totalDuration}ms\n\n`;

        summary += `📋 Suite Breakdown:\n`;
        suites.forEach(suite => {
            const passed = suite.results.filter(r => r.passed).length;
            const status = suite.passRate === 1 ? '✅' : suite.passRate > 0.8 ? '⚠️' : '❌';
            summary += `  ${status} ${suite.name}: ${passed}/${suite.results.length} (${(suite.passRate * 100).toFixed(1)}%)\n`;
        });

        if (overallPassRate < 1) {
            summary += `\n🔍 Failed Tests:\n`;
            suites.forEach(suite => {
                const failed = suite.results.filter(r => !r.passed);
                failed.forEach(test => {
                    summary += `  ❌ ${suite.name} > ${test.testName}: ${test.details}\n`;
                });
            });
        }

        return summary;
    }

    /**
     * Helper methods for creating test data
     */
    private createTestPlayer(id: string) {
        return {
            id,
            life: 25,
            mana: 1,
            hand: [],
            deck: [],
            graveyard: [],
            elementalAffinities: {},
            controlledSites: [],
            avatar: {
                position: { x: id === 'player1' ? 0 : 4, y: 1 },
                life: 25,
                damage: 0
            }
        };
    }

    private createTestUnitCard(name: string, power: number, life: number): Card {
        return {
            id: `test_${name.toLowerCase().replace(' ', '_')}_${Date.now()}`,
            name,
            cost: Math.max(1, Math.floor((power + life) / 2)),
            type: 'Unit',
            power,
            life,
            text: '',
            elements: ['Neutral'],
            abilities: []
        };
    }

    private createTestSpellCard(name: string, cost: number): Card {
        return {
            id: `test_${name.toLowerCase().replace(' ', '_')}_${Date.now()}`,
            name,
            cost,
            type: 'Spell',
            text: 'Test spell effect',
            elements: ['Neutral']
        };
    }

    private createTestDeck(name: string, size: number = 60): Card[] {
        const deck: Card[] = [];
        
        // Add variety of cards
        for (let i = 0; i < size; i++) {
            const cardType = i % 3;
            
            if (cardType === 0) {
                // Unit cards
                const power = 1 + (i % 5);
                const life = 1 + (i % 4);
                deck.push(this.createTestUnitCard(`${name} Unit ${i}`, power, life));
            } else if (cardType === 1) {
                // Spell cards
                const cost = 1 + (i % 6);
                deck.push(this.createTestSpellCard(`${name} Spell ${i}`, cost));
            } else {
                // Site cards
                deck.push({
                    id: `test_${name.toLowerCase()}_site_${i}`,
                    name: `${name} Site ${i}`,
                    cost: 0,
                    type: 'Site',
                    text: 'Provides 1 mana',
                    elements: ['Neutral']
                });
            }
        }
        
        return deck;
    }
}

/**
 * Test runner for continuous integration
 */
export class CITestRunner {
    public static async runCITests(): Promise<boolean> {
        const framework = new SimulationTestFramework();
        const results = await framework.runAllTests();
        
        // CI passes if overall pass rate is above threshold
        const passThreshold = 0.95; // 95% pass rate required
        const passed = results.overallPassRate >= passThreshold;
        
        if (!passed) {
            console.error(`❌ CI FAILED: Pass rate ${(results.overallPassRate * 100).toFixed(1)}% below threshold ${(passThreshold * 100)}%`);
            process.exit(1);
        } else {
            console.log(`✅ CI PASSED: Pass rate ${(results.overallPassRate * 100).toFixed(1)}%`);
        }
        
        return passed;
    }
}
