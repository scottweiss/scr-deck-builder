# Sorcery: Contested Realm - Deck Builder

A comprehensive deck building and simulation system for Sorcery: Contested Realm trading card game.

## Features

- 🎯 **Smart Deck Building**: AI-powered deck construction with element and archetype optimization
- 🃏 **Card Database**: Complete card database with all sets and cards
- ⚔️ **Game Simulation**: Full game simulation engine for testing decks
- 🧪 **Deck Analysis**: Advanced deck statistics and synergy calculations
- 🌐 **Web Interface**: Modern web-based deck builder interface
- 📊 **Testing Suite**: Comprehensive test coverage for all systems

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
src/
├── core/           # Core game logic
│   ├── deck/       # Deck building and analysis
│   ├── cards/      # Card data and analysis
│   ├── simulation/ # Game simulation engine
│   └── rules/      # Game rules enforcement
├── types/          # TypeScript type definitions
├── web/            # Web interface
├── data/           # Card data files
└── tests/          # Test suites
```

## Usage

### Building a Deck

```typescript
import { DeckBuilder } from './src';

const deck = DeckBuilder.buildOptimizedDeck({
  availableCards: cardDatabase,
  avatar: selectedAvatar,
  preferredElements: [Element.Water, Element.Fire],
  archetype: 'Control'
});
```

### Running the Web Interface

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

## Development

### Adding New Cards

1. Add card data to `src/data/processed/`
2. Update type definitions if needed
3. Run tests to ensure compatibility

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test phase1-core

# Run with UI
npm run test:ui
```

## License

This is a fan-made project for educational purposes. Sorcery: Contested Realm is a trademark of its respective owners.
