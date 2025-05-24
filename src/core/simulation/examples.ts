/**
 * Usage examples and demonstration of the match simulation system
 */

import { Card } from '../../types/Card';
import { SimulationIntegration, DeckSimulationConfig } from './simulationIntegration';
import { AI_STRATEGIES } from './aiEngine';
import { SimulationTestFramework } from './testFramework';

/**
 * Example: Basic deck testing
 */
export async function exampleBasicDeckTesting() {
    console.log('🎯 Example: Basic Deck Testing\n');

    const integration = new SimulationIntegration();

    // Create a sample deck
    const deck = createSampleAggroDeck();
    
    console.log(`Testing deck: "${deck[0].name.split(' ')[0]} Deck" (${deck.length} cards)`);

    // Basic performance analysis
    const config: DeckSimulationConfig = {
        deck,
        strategy: AI_STRATEGIES.AGGRESSIVE,
        testRuns: 20,
        enableLogging: false
    };

    const report = await integration.analyzeDeckPerformance(config);

    console.log(`\n📊 Results:`);
    console.log(`  Win Rate: ${(report.winRate * 100).toFixed(1)}%`);
    console.log(`  Average Game Length: ${report.averageTurns.toFixed(1)} turns`);
    console.log(`  Consistency Score: ${(report.consistency.score * 100).toFixed(1)}%`);

    if (report.consistency.issues.length > 0) {
        console.log(`\n⚠️  Consistency Issues:`);
        report.consistency.issues.forEach(issue => console.log(`    • ${issue}`));
    }

    if (report.consistency.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`);
        report.consistency.recommendations.forEach(rec => console.log(`    • ${rec}`));
    }

    console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example: Deck vs deck matchup analysis
 */
export async function exampleMatchupAnalysis() {
    console.log('🎯 Example: Deck vs Deck Matchup Analysis\n');

    const integration = new SimulationIntegration();

    // Create two different decks
    const aggroDeck = createSampleAggroDeck();
    const controlDeck = createSampleControlDeck();

    console.log('Testing Aggro vs Control matchup...');

    // Run batch simulation
    const result = await integration.batchSimulate(
        aggroDeck,
        controlDeck,
        30, // 30 games
        AI_STRATEGIES.AGGRESSIVE,
        AI_STRATEGIES.CONTROL
    );

    console.log(`\n📊 Matchup Results (${result.totalGames} games):`);
    console.log(`  Aggro Wins: ${result.player1Wins} (${(result.player1WinRate * 100).toFixed(1)}%)`);
    console.log(`  Control Wins: ${result.player2Wins} (${(result.player2WinRate * 100).toFixed(1)}%)`);
    console.log(`  Ties: ${result.ties}`);
    console.log(`  Average Game Length: ${result.averageTurns.toFixed(1)} turns`);
    console.log(`  Average Game Duration: ${(result.averageDuration / 1000).toFixed(1)}s`);

    console.log(`\n🎯 Win Conditions:`);
    Object.entries(result.winsByReason).forEach(([reason, count]) => {
        console.log(`  ${reason}: ${count} games (${((count / result.totalGames) * 100).toFixed(1)}%)`);
    });

    console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example: Deck optimization
 */
export async function exampleDeckOptimization() {
    console.log('🎯 Example: Deck Optimization\n');

    const integration = new SimulationIntegration();

    // Start with a base deck
    const baseDeck = createSampleMidrangeDeck();
    console.log(`Base deck: ${baseDeck.length} cards`);

    // Create some variations to test
    const variations = [
        createDeckVariation(baseDeck, 'more_aggro'),
        createDeckVariation(baseDeck, 'more_control'),
        createDeckVariation(baseDeck, 'better_curve')
    ];

    console.log(`Testing ${variations.length} deck variations...`);

    // Find optimal build
    const optimization = await integration.optimizeDeck(
        baseDeck,
        variations,
        AI_STRATEGIES.MIDRANGE,
        15 // 15 games per variation
    );

    console.log(`\n📊 Optimization Results:`);
    console.log(`  Best Win Rate: ${(optimization.results[0].winRate * 100).toFixed(1)}%`);
    
    if (optimization.improvements.length > 0) {
        console.log(`\n✨ Improvements Found:`);
        optimization.improvements.forEach(improvement => {
            console.log(`    • ${improvement}`);
        });
    }

    // Show deck analysis for best performing deck
    const bestResult = optimization.results.reduce((best, current) => 
        current.winRate > best.winRate ? current : best
    );

    if (bestResult.deckOptimization.cardChanges.length > 0) {
        console.log(`\n🔧 Suggested Card Changes:`);
        bestResult.deckOptimization.cardChanges.slice(0, 3).forEach(change => {
            console.log(`    • ${change.action} ${change.card}: ${change.reason}`);
        });
    }

    console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example: AI strategy comparison
 */
export async function exampleAIStrategyComparison() {
    console.log('🎯 Example: AI Strategy Comparison\n');

    const integration = new SimulationIntegration();
    const testDeck = createSampleMidrangeDeck();

    const strategies = [
        { name: 'Aggressive', strategy: AI_STRATEGIES.AGGRESSIVE },
        { name: 'Control', strategy: AI_STRATEGIES.CONTROL },
        { name: 'Midrange', strategy: AI_STRATEGIES.MIDRANGE },
        { name: 'Defensive', strategy: AI_STRATEGIES.DEFENSIVE }
    ];

    console.log(`Testing ${strategies.length} AI strategies with the same deck...`);

    const results = [];

    for (const { name, strategy } of strategies) {
        console.log(`  Testing ${name} strategy...`);
        
        const config: DeckSimulationConfig = {
            deck: testDeck,
            strategy,
            testRuns: 10,
            enableLogging: false
        };

        const report = await integration.analyzeDeckPerformance(config);
        results.push({ name, report });
    }

    console.log(`\n📊 Strategy Comparison:`);
    results.forEach(({ name, report }) => {
        console.log(`  ${name.padEnd(12)}: ${(report.winRate * 100).toFixed(1)}% wins, ${report.averageTurns.toFixed(1)} avg turns`);
    });

    // Find best strategy
    const bestStrategy = results.reduce((best, current) => 
        current.report.winRate > best.report.winRate ? current : best
    );

    console.log(`\n🏆 Best Strategy: ${bestStrategy.name} (${(bestStrategy.report.winRate * 100).toFixed(1)}% win rate)`);

    console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example: Meta analysis
 */
export async function exampleMetaAnalysis() {
    console.log('🎯 Example: Meta Game Analysis\n');

    const integration = new SimulationIntegration();

    // Create a deck to test against "meta"
    const testDeck = createSampleAggroDeck();
    
    // Create some "meta" decks
    const metaDecks = [
        createSampleAggroDeck(),
        createSampleControlDeck(),
        createSampleMidrangeDeck(),
        createSampleComboLike()
    ];

    console.log(`Testing deck against ${metaDecks.length} meta archetypes...`);

    const config: DeckSimulationConfig = {
        deck: testDeck,
        opponentDecks: metaDecks,
        strategy: AI_STRATEGIES.AGGRESSIVE,
        testRuns: 15
    };

    const report = await integration.analyzeDeckPerformance(config);

    console.log(`\n📊 Meta Performance:`);
    console.log(`  Overall Win Rate: ${(report.winRate * 100).toFixed(1)}%`);
    console.log(`  Consistency: ${(report.consistency.score * 100).toFixed(1)}%`);

    if (report.matchupResults.length > 0) {
        console.log(`\n🎯 Matchup Breakdown:`);
        report.matchupResults.forEach((matchup, i) => {
            const archetype = ['Aggro', 'Control', 'Midrange', 'Combo'][i] || `Deck ${i}`;
            const winRate = (matchup.winRate * 100).toFixed(1);
            const status = matchup.winRate > 0.6 ? '✅' : matchup.winRate > 0.4 ? '⚠️' : '❌';
            console.log(`    ${status} vs ${archetype}: ${winRate}% (${matchup.gamesPlayed} games)`);
        });
    }

    if (report.strengthsAndWeaknesses.strengths.length > 0) {
        console.log(`\n💪 Strengths:`);
        report.strengthsAndWeaknesses.strengths.forEach(strength => {
            console.log(`    • ${strength}`);
        });
    }

    if (report.strengthsAndWeaknesses.weaknesses.length > 0) {
        console.log(`\n⚠️  Weaknesses:`);
        report.strengthsAndWeaknesses.weaknesses.forEach(weakness => {
            console.log(`    • ${weakness}`);
        });
    }

    console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example: Running the test framework
 */
export async function exampleTestFramework() {
    console.log('🎯 Example: Running Test Framework\n');

    const framework = new SimulationTestFramework();
    const results = await framework.runAllTests();

    console.log(`\n📋 Test Framework Results:`);
    console.log(`  Overall Pass Rate: ${(results.overallPassRate * 100).toFixed(1)}%`);
    console.log(`  Total Suites: ${results.suites.length}`);

    // Show suite summary
    results.suites.forEach(suite => {
        const passed = suite.results.filter(r => r.passed).length;
        const status = suite.passRate === 1 ? '✅' : suite.passRate > 0.8 ? '⚠️' : '❌';
        console.log(`    ${status} ${suite.name}: ${passed}/${suite.results.length} tests passed`);
    });

    console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example: Single match simulation with detailed logging
 */
export async function exampleDetailedMatch() {
    console.log('🎯 Example: Detailed Match Simulation\n');

    const integration = new SimulationIntegration();

    const deck1 = createSampleAggroDeck();
    const deck2 = createSampleControlDeck();

    console.log('Running detailed match: Aggro vs Control...');

    const result = await integration.simulateMatch(
        deck1,
        deck2,
        AI_STRATEGIES.AGGRESSIVE,
        AI_STRATEGIES.CONTROL,
        {
            enableLogging: true,
            maxTurns: 30
        }
    );

    console.log(`\n🎮 Match Result:`);
    console.log(`  Winner: ${result.winner || 'Tie'}`);
    console.log(`  Reason: ${result.reason}`);
    console.log(`  Duration: ${result.turns} turns (${(result.duration / 1000).toFixed(1)}s)`);

    console.log(`\n📊 Game Statistics:`);
    const stats = result.statistics;
    console.log(`  Total Actions: ${stats.totalActions}`);
    console.log(`  Combat Resolutions: ${stats.combatResolutions}`);
    console.log(`  Spells Cast: ${stats.spellsCast}`);
    console.log(`  Units Played: ${stats.unitsPlayed}`);

    // Show some key game events
    if (result.gameLog.length > 0) {
        console.log(`\n📜 Key Events (last 5):`);
        result.gameLog.slice(-5).forEach(entry => {
            console.log(`    Turn ${entry.turn}: ${entry.action} (${entry.playerId})`);
        });
    }

    console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Helper functions to create sample decks
 */
function createSampleAggroDeck(): Card[] {
    const deck: Card[] = [];

    // Low cost aggressive units
    for (let i = 0; i < 12; i++) {
        deck.push({
            id: `aggro_unit_${i}`,
            name: `Aggressive Creature ${i}`,
            cost: 1 + (i % 3),
            type: 'Unit',
            power: 2 + (i % 2),
            life: 1 + (i % 2),
            text: 'Fast and aggressive',
            elements: ['Fire', 'Neutral'][i % 2] ? ['Fire'] : ['Neutral'],
            abilities: i % 4 === 0 ? ['haste'] : []
        });
    }

    // Burn spells
    for (let i = 0; i < 8; i++) {
        deck.push({
            id: `burn_spell_${i}`,
            name: `Lightning Strike ${i}`,
            cost: 1 + (i % 2),
            type: 'Spell',
            text: `Deal ${2 + (i % 2)} damage to any target`,
            elements: ['Fire']
        });
    }

    // Fill to 60 with more units and sites
    while (deck.length < 60) {
        const remaining = 60 - deck.length;
        if (remaining % 2 === 0) {
            deck.push(createSampleSite('Fire Site', 'Fire'));
        } else {
            deck.push(createSampleUnit('Filler Unit', 2, 1, 1, ['Neutral']));
        }
    }

    return deck;
}

function createSampleControlDeck(): Card[] {
    const deck: Card[] = [];

    // Expensive powerful units
    for (let i = 0; i < 8; i++) {
        deck.push({
            id: `control_unit_${i}`,
            name: `Powerful Guardian ${i}`,
            cost: 4 + (i % 3),
            type: 'Unit',
            power: 3 + (i % 3),
            life: 4 + (i % 2),
            text: 'Defensive powerhouse',
            elements: ['Water', 'Earth'][i % 2] ? ['Water'] : ['Earth'],
            abilities: i % 3 === 0 ? ['intercept'] : []
        });
    }

    // Control spells
    for (let i = 0; i < 12; i++) {
        deck.push({
            id: `control_spell_${i}`,
            name: `Control Magic ${i}`,
            cost: 2 + (i % 4),
            type: 'Spell',
            text: 'Counter target spell or destroy target unit',
            elements: ['Water', 'Earth'][i % 2] ? ['Water'] : ['Earth']
        });
    }

    // Card draw
    for (let i = 0; i < 6; i++) {
        deck.push({
            id: `draw_spell_${i}`,
            name: `Divination ${i}`,
            cost: 2,
            type: 'Spell',
            text: 'Draw 2 cards',
            elements: ['Water']
        });
    }

    // Fill to 60
    while (deck.length < 60) {
        const remaining = 60 - deck.length;
        if (remaining % 2 === 0) {
            deck.push(createSampleSite('Water Site', 'Water'));
        } else {
            deck.push(createSampleSite('Earth Site', 'Earth'));
        }
    }

    return deck;
}

function createSampleMidrangeDeck(): Card[] {
    const deck: Card[] = [];

    // Balanced mix of units
    for (let i = 0; i < 16; i++) {
        const cost = 2 + (i % 4);
        deck.push({
            id: `midrange_unit_${i}`,
            name: `Balanced Creature ${i}`,
            cost,
            type: 'Unit',
            power: cost,
            life: cost,
            text: 'Well-rounded stats',
            elements: ['Air', 'Neutral'][i % 2] ? ['Air'] : ['Neutral'],
            abilities: []
        });
    }

    // Versatile spells
    for (let i = 0; i < 10; i++) {
        deck.push({
            id: `midrange_spell_${i}`,
            name: `Versatile Magic ${i}`,
            cost: 2 + (i % 3),
            type: 'Spell',
            text: 'Flexible spell effect',
            elements: ['Air']
        });
    }

    // Fill to 60
    while (deck.length < 60) {
        deck.push(createSampleSite('Air Site', 'Air'));
    }

    return deck;
}

function createSampleComboLike(): Card[] {
    const deck: Card[] = [];

    // Combo pieces
    for (let i = 0; i < 8; i++) {
        deck.push({
            id: `combo_piece_${i}`,
            name: `Combo Component ${i}`,
            cost: 3,
            type: 'Unit',
            power: 1,
            life: 2,
            text: 'Part of powerful combo',
            elements: ['Chaos'],
            abilities: ['combo']
        });
    }

    // Enablers
    for (let i = 0; i < 12; i++) {
        deck.push({
            id: `enabler_${i}`,
            name: `Combo Enabler ${i}`,
            cost: 1 + (i % 2),
            type: 'Spell',
            text: 'Enables combo execution',
            elements: ['Chaos']
        });
    }

    // Fill to 60
    while (deck.length < 60) {
        deck.push(createSampleSite('Chaos Site', 'Chaos'));
    }

    return deck;
}

function createSampleUnit(name: string, cost: number, power: number, life: number, elements: string[]): Card {
    return {
        id: `unit_${name.toLowerCase().replace(' ', '_')}_${Date.now()}`,
        name,
        cost,
        type: 'Unit',
        power,
        life,
        text: '',
        elements
    };
}

function createSampleSite(name: string, element: string): Card {
    return {
        id: `site_${name.toLowerCase().replace(' ', '_')}_${Date.now()}`,
        name,
        cost: 0,
        type: 'Site',
        text: `Provides ${element} mana`,
        elements: [element]
    };
}

function createDeckVariation(baseDeck: Card[], variationType: string): Card[] {
    const deck = [...baseDeck];
    
    // Simple variations for demonstration
    switch (variationType) {
        case 'more_aggro':
            // Replace some expensive cards with cheaper ones
            deck.forEach((card, i) => {
                if (card.cost && card.cost > 4 && i % 3 === 0) {
                    deck[i] = createSampleUnit('Aggro Variant', 2, 3, 1, card.elements || ['Neutral']);
                }
            });
            break;
            
        case 'more_control':
            // Add more expensive cards
            deck.forEach((card, i) => {
                if (card.cost && card.cost < 3 && i % 4 === 0) {
                    deck[i] = createSampleUnit('Control Variant', 5, 2, 6, card.elements || ['Neutral']);
                }
            });
            break;
            
        case 'better_curve':
            // Improve mana curve distribution
            // This is a simplified example
            break;
    }
    
    return deck;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('🚀 Running Sorcery: Contested Realm Match Simulation Examples\n');
    console.log('=' * 60 + '\n');

    try {
        await exampleBasicDeckTesting();
        await exampleMatchupAnalysis();
        await exampleDeckOptimization();
        await exampleAIStrategyComparison();
        await exampleMetaAnalysis();
        await exampleDetailedMatch();
        await exampleTestFramework();

        console.log('✅ All examples completed successfully!');
        console.log('\n📖 The simulation system is ready for use.');
        console.log('💡 Check the generated reports for insights into deck performance and balance.');
        
    } catch (error) {
        console.error('❌ Example execution failed:', error);
        throw error;
    }
}

// Export for easy running
if (require.main === module) {
    runAllExamples().catch(console.error);
}
