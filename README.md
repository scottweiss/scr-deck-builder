# Sorcery: Contested Realm Deck Building System

A comprehensive deck building and analysis system for Sorcery: Contested Realm card game.

## Project Structure

The project has been organized into the following directory structure:

```
.
├── src/                      # Source code
│   ├── analyses/             # Analysis modules
│   │   ├── playability/      # Deck playability analysis
│   │   ├── position/         # Position-based analysis 
│   │   └── synergy/          # Card synergy analysis
│   ├── browser/              # Browser-specific implementations
│   │   ├── browser-entry.ts  # Browser entry point
│   │   └── unified-deck-builder.ts # Unified interface
│   ├── core/                 # Core functionality
│   │   ├── cards/            # Card-related functionality
│   │   ├── deck/             # Deck construction and validation
│   │   ├── gameplay/         # Gameplay mechanics (future)
│   │   └── rules/            # Game rules and enforcement
│   ├── data/                 # Data files and processing
│   │   ├── processed/        # Processed card data
│   │   └── raw/              # Raw CSV card data files
│   ├── docs/                 # Documentation
│   ├── main/                 # Main entry points
│   ├── optimization/         # Performance optimizations
│   ├── tests/                # Test scripts
│   ├── tools/                # Utility tools
│   └── utils/                # Common utility functions
└── scripts/                  # Convenience scripts for users
```

## Quick Start

To build a deck using npm scripts:

```bash
# Install dependencies
npm install

# Run the deck builder
npm run build-deck -- --element Water
```

Or using the direct scripts:

```bash
node scripts/build-deck.js --element Water
```

## Available Scripts

```bash
# Start the default deck builder
npm start

# Build a deck with specific options
npm run build-deck -- --element Fire

# Run tests
npm run test:playability
npm run test:position
npm run test:performance

# Switch between original and optimized systems
npm run switch:original
npm run switch:optimized
npm run system:status
```

For more options, see the documentation in `src/docs/`

## Components

- **Card Data Processing**: Converts raw CSV data into structured card data
- **Deck Building Core**: Creates optimized decks with rule enforcement
- **Position-based System**: Handles underwater, airborne, and underground mechanics
- **Playability Enhancement**: Ensures decks are balanced and playable
- **Unified Browser Interface**: TypeScript-based deck building in web browsers
- **Test Scripts**: Validates system functionality

## Unified Deck Building System

The project now features a unified TypeScript-first deck building architecture that works in both CLI and browser environments. This eliminates the previous dual system approach.

```bash
# Build the unified browser system
npm run build:browser

# Open web tests
open web/deck-builder/unified-test.html
open web/deck-builder/unified-demo.html
```

The unified system provides consistent deck building logic across platforms, with these benefits:
- Single source of truth for deck building algorithms
- Shared synergy calculations, combo detection, and validation
- Complete feature parity between CLI and browser environments
- Modern web UI with advanced deck analysis capabilities

See `UNIFIED-DECK-BUILDER-COMPLETE.md` for detailed documentation.

## Performance Optimization

The system includes optimized versions of core components for better performance.
See `src/docs/UPGRADE-INSTRUCTIONS.md` for details.
