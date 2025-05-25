# Sorcery: Contested Realm Match Simulation System

A comprehensive automated gameplay simulation system for testing deck performance, balance analysis, and AI decision-making in Sorcery: Contested Realm.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Installation & Setup](#installation--setup)
- [Quick Start](#quick-start)
- [Core Components](#core-components)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Testing Framework](#testing-framework)
- [Performance Considerations](#performance-considerations)
- [Contributing](#contributing)

## Overview

This simulation system provides a complete implementation of Sorcery: Contested Realm game mechanics, allowing for automated testing of deck builds, matchup analysis, and balance validation. The system handles complex game rules including turn phases, combat with intercept/defend mechanics, positional gameplay on a 5x4 grid, and sophisticated AI decision-making.

### Key Capabilities

- **Complete Game Simulation**: Full implementation of SCR rules and mechanics
- **AI Players**: Multiple AI strategies with strategic decision-making
- **Deck Analysis**: Performance testing, consistency analysis, and optimization suggestions
- **Batch Processing**: Statistical analysis through multiple game simulations
- **Matchup Testing**: Head-to-head deck performance analysis
- **Meta Analysis**: Testing against established deck archetypes

## Features

### ✅ Game Mechanics
- [x] Turn-based gameplay with proper phase management
- [x] 5x4 grid positioning with four regions (void/surface/underground/underwater)
- [x] Complete combat system with intercept/defend mechanics
- [x] Mana and elemental threshold systems
- [x] Spell effect parsing and execution
- [x] Site placement with adjacency rules
- [x] Unit movement and positioning
- [x] Avatar mechanics and win conditions

### ✅ AI System
- [x] Multiple AI strategies (Aggressive, Control, Midrange, Defensive)
- [x] Strategic decision-making based on game state analysis
- [x] Action evaluation and prioritization
- [x] Adaptive behavior based on board position and resources

### ✅ Analysis Tools
- [x] Deck performance testing
- [x] Win rate and consistency analysis
- [x] Matchup analysis between specific decks
- [x] Meta game performance evaluation
- [x] Deck optimization suggestions
- [x] Statistical reporting and visualization

### ✅ Integration
- [x] Seamless integration with existing deck building system
- [x] Comprehensive testing framework
- [x] Batch simulation for statistical significance
- [x] Performance monitoring and optimization

## System Architecture

```
src/core/simulation/
├── gameState.ts           # Core game state management
├── turnEngine.ts          # Turn-based game logic
├── aiEngine.ts            # AI decision-making system
├── combatSystem.ts        # Combat mechanics and resolution
├── spellEffectSystem.ts   # Spell parsing and execution
├── matchSimulator.ts      # Complete match orchestration
├── deckTestSuite.ts       # Deck analysis and testing
├── simulationIntegration.ts # Integration with deck builder
├── testFramework.ts       # Comprehensive testing system
├── examples.ts            # Usage examples and demos
└── README.md              # This documentation
```

### Component Relationships

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Deck Builder   │───▶│   Integration   │───▶│  Test Results   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Engine     │◀──▶│ Match Simulator │◀──▶│  Turn Engine    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │                        │
                               ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Combat System   │◀───│   Game State    │───▶│ Spell System    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- TypeScript (v4.5 or higher)
- Existing SCR deck building system

### Setup Instructions

1. **Ensure all dependencies are installed:**
   ```bash
   npm install
   ```

2. **Verify TypeScript compilation:**
   ```bash
   npm run build
   ```

3. **Run the test framework to validate installation:**
   ```typescript
   import { SimulationTestFramework } from './src/core/simulation/testFramework';
   
   const framework = new SimulationTestFramework();
   await framework.runAllTests();
   ```

## Quick Start

### Basic Deck Testing

```typescript
import { SimulationIntegration } from './src/core/simulation/simulationIntegration';
import { AI_STRATEGIES } from './src/core/simulation/ai/aiStrategies';

const integration = new SimulationIntegration();

// Test your deck
const myDeck = loadDeckFromBuilder(); // Your deck loading logic
const report = await integration.analyzeDeckPerformance({
    deck: myDeck,
    strategy: AI_STRATEGIES.MIDRANGE,
    testRuns: 50
});

console.log(`Win Rate: ${(report.winRate * 100).toFixed(1)}%`);
console.log(`Consistency: ${(report.consistency.score * 100).toFixed(1)}%`);
```

### Matchup Analysis

```typescript
// Compare two decks
const result = await integration.batchSimulate(
    deck1, 
    deck2, 
    100, // number of games
    AI_STRATEGIES.AGGRESSIVE,
    AI_STRATEGIES.CONTROL
);

console.log(`Deck 1 wins: ${result.player1WinRate * 100}%`);
console.log(`Average game length: ${result.averageTurns} turns`);
```

### Deck Optimization

```typescript
// Find optimal deck configuration
const optimization = await integration.optimizeDeck(
    baseDeck,
    variations,
    AI_STRATEGIES.MIDRANGE,
    30 // games per variation
);

console.log('Best performing deck:', optimization.bestDeck);
console.log('Improvements:', optimization.improvements);
```

## Core Components

### GameStateManager
Manages the complete game state including:
- 5x4 grid with regional properties
- Player state (life, mana, hands, decks)
- Unit positioning and status
- Game phase tracking
- Event system for actions

### TurnEngine
Handles turn-based gameplay:
- Phase management (start/main/end)
- Action validation and execution
- Site placement mechanics
- Movement and combat initiation
- Turn progression

### AIEngine
Provides intelligent gameplay:
- Multiple strategy implementations
- Game state analysis
- Action generation and evaluation
- Strategic decision-making

### CombatSystem
Implements combat mechanics:
- Intercept/defend resolution
- Damage calculation
- Special abilities (Double Strike, Trample)
- Post-combat effects

### SpellEffectSystem
Handles spell mechanics:
- Natural language text parsing
- Effect type identification
- Target validation
- Spell execution

## Usage Examples

### Example 1: Basic Performance Test
```typescript
import { exampleBasicDeckTesting } from './src/core/simulation/examples';
await exampleBasicDeckTesting();
```

### Example 2: Meta Analysis
```typescript
import { exampleMetaAnalysis } from './src/core/simulation/examples';
await exampleMetaAnalysis();
```

### Example 3: AI Strategy Comparison
```typescript
import { exampleAIStrategyComparison } from './src/core/simulation/examples';
await exampleAIStrategyComparison();
```

See `examples.ts` for complete implementations of all usage patterns.

## API Reference

### SimulationIntegration

#### `analyzeDeckPerformance(config: DeckSimulationConfig): Promise<DeckPerformanceReport>`
Comprehensive deck analysis including win rates, consistency, and optimization suggestions.

#### `batchSimulate(deck1: Card[], deck2: Card[], runs: number): Promise<BatchResult>`
Run multiple simulations for statistical analysis.

#### `optimizeDeck(baseDeck: Card[], variations: Card[][]): Promise<OptimizationResult>`
Test deck variations to find optimal build.

#### `validateDeck(deck: Card[]): ValidationResult`
Validate deck composition and suggest improvements.

### MatchSimulator

#### `simulateMatch(config: SimulationConfig): Promise<SimulationResult>`
Run a complete match simulation with detailed logging and statistics.

### AI Strategies

Available strategies:
- `AI_STRATEGIES.AGGRESSIVE`: High aggression, fast games
- `AI_STRATEGIES.CONTROL`: Defensive play, card advantage
- `AI_STRATEGIES.MIDRANGE`: Balanced approach
- `AI_STRATEGIES.DEFENSIVE`: Maximum survivability

## Testing Framework

### Running Tests

```typescript
import { SimulationTestFramework } from './src/core/simulation/testFramework';

const framework = new SimulationTestFramework();
const results = await framework.runAllTests();
```

### Test Suites

1. **Game State Management**: Core state functionality
2. **Turn Engine**: Turn progression and action handling
3. **Combat System**: Combat mechanics and resolution
4. **AI Engine**: Decision-making and strategy
5. **Spell System**: Effect parsing and execution
6. **Match Simulation**: Complete game simulation
7. **Deck Analysis**: Performance testing and analysis
8. **Integration**: System integration testing
9. **Performance**: Speed and memory usage
10. **Edge Cases**: Error handling and corner cases

### Continuous Integration

```typescript
import { CITestRunner } from './src/core/simulation/testFramework';
const passed = await CITestRunner.runCITests();
```

## Performance Considerations

### Optimization Settings

- **Batch Size**: Optimize batch simulation sizes for your hardware
- **Timeout Values**: Adjust timeouts based on expected game length
- **Logging**: Disable detailed logging for performance-critical tests
- **AI Depth**: Balance AI decision quality vs. speed

### Recommended Settings

```typescript
// For development and testing
const devConfig = {
    testRuns: 20,
    timeoutMs: 30000,
    enableLogging: true,
    maxTurns: 50
};

// For production analysis
const prodConfig = {
    testRuns: 100,
    timeoutMs: 15000,
    enableLogging: false,
    maxTurns: 30
};
```

### Memory Management

The system is designed to handle large batch runs efficiently:
- Automatic cleanup after each simulation
- Minimal memory footprint per game
- Garbage collection optimization
- Event log rotation for long-running tests

## Integration with Existing Systems

### Deck Builder Integration

```typescript
// Connect with existing deck builder
import { deckBuilder } from '../deck/deckBuilder';

const deck = deckBuilder.getCurrentDeck();
const report = await integration.analyzeDeckPerformance({
    deck: deck.cards,
    strategy: AI_STRATEGIES.MIDRANGE,
    testRuns: 50
});

// Update deck builder with recommendations
deckBuilder.updateRecommendations(report.deckOptimization);
```

### Web Interface Integration

```typescript
// API endpoint for web interface
app.post('/api/simulate', async (req, res) => {
    const { deck, strategy, runs } = req.body;
    
    const report = await integration.analyzeDeckPerformance({
        deck,
        strategy,
        testRuns: runs
    });
    
    res.json(report);
});
```

## Output and Reporting

### Performance Reports

The system generates comprehensive reports including:

- **Win Rate Analysis**: Overall and matchup-specific win rates
- **Consistency Metrics**: Deck reliability and performance variance
- **Optimization Suggestions**: Card changes and strategy adjustments
- **Meta Performance**: Effectiveness against established archetypes
- **Statistical Analysis**: Confidence intervals and significance testing

### Report Formats

```typescript
interface DeckPerformanceReport {
    winRate: number;
    averageTurns: number;
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
        cardChanges: CardChange[];
        elementBalance: ElementAnalysis;
        curveAnalysis: CurveAnalysis;
    };
}
```

## Troubleshooting

### Common Issues

**Slow Simulations**
- Reduce test runs for initial testing
- Disable detailed logging
- Lower timeout values
- Use simpler AI strategies

**Memory Issues**
- Run smaller batch sizes
- Force garbage collection between batches
- Monitor memory usage during long runs

**Invalid Results**
- Verify deck composition meets game rules
- Check for banned or invalid cards
- Ensure proper card format

### Debug Mode

Enable debug mode for detailed tracing:

```typescript
const config = {
    enableLogging: true,
    debugMode: true,
    verboseOutput: true
};
```

## Contributing

### Development Guidelines

1. **Code Style**: Follow existing TypeScript conventions
2. **Testing**: Add tests for new features
3. **Documentation**: Update README and inline docs
4. **Performance**: Consider impact on simulation speed

### Adding New Features

1. **Game Mechanics**: Extend core systems in gameState.ts
2. **AI Strategies**: Add new strategies to aiEngine.ts
3. **Analysis Tools**: Enhance deckTestSuite.ts
4. **Integration**: Update simulationIntegration.ts

### Testing New Features

```typescript
// Add tests to testFramework.ts
private async testNewFeature(): Promise<TestSuite> {
    const results: TestResult[] = [];
    
    results.push(await this.runTest('New Feature Test', async () => {
        // Test implementation
        return 'Feature working correctly';
    }));
    
    return this.createTestSuite('New Feature', results);
}
```

## Future Enhancements

### Planned Features

- [ ] **Advanced Metrics**: ELO rating system for deck strength
- [ ] **Machine Learning**: AI strategy optimization through ML
- [ ] **Tournament Simulation**: Multi-round tournament testing
- [ ] **Sideboard Support**: Full sideboard and game 2/3 simulation
- [ ] **Real-time Analysis**: Live game state analysis during play
- [ ] **Visualization**: Interactive charts and graphs for results
- [ ] **API Extensions**: REST API for external integrations
- [ ] **Performance Profiling**: Detailed performance analysis tools

### Extensibility

The system is designed for easy extension:

```typescript
// Add new AI strategy
export const CUSTOM_STRATEGY: AIStrategy = {
    name: 'Custom',
    aggression: 0.7,
    efficiency: 0.8,
    positioning: 0.6,
    cardAdvantage: 0.5
};

// Add new analysis metric
interface CustomMetric {
    calculate(games: SimulationResult[]): number;
    interpret(value: number): string;
}
```

---

## License

This simulation system is part of the Sorcery: Contested Realm deck builder project. Please refer to the main project license for usage terms.

## Support

For questions, bug reports, or feature requests:
1. Check existing documentation
2. Run the test framework to verify installation
3. Review the examples for usage patterns
4. Submit issues through the project repository

---

*Last updated: December 2024*
*Version: 1.0.0*
