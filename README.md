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
- **Test Scripts**: Validates system functionality

## Performance Optimization

The system includes optimized versions of core components for better performance.
See `src/docs/UPGRADE-INSTRUCTIONS.md` for details.
