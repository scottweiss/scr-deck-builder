# Sorcery Card Data Documentation

## Overview
This directory contains processed card data for Sorcery: Contested Realm.

## Files Generated
- `sorceryCards.data.js`: Compressed card data (${(dataSize / 1024 / 1024).toFixed(2)} MB)
- `sorceryCards.optimized.js`: Lazy loading wrapper (${(optimizedSize / 1024).toFixed(2)} KB)

## Statistics
- Total cards: ${stats.total} raw records processed
- Beta cards: ${stats.beta}
- Arthurian Legends cards: ${stats.arthurian}
- Final card count: ${allCards.length}
- Foil cards filtered: ${stats.foils}
- Booster products filtered: ${stats.boosters}

## Usage

\`\`\`javascript
const cardData = require('./sorceryCards.optimized');

// Get all cards (lazy loaded)
const allCards = cardData.getAllCards();

// Get cards by set
const betaCards = cardData.getBetaCards();
const arthurianCards = cardData.getArthurianCards();

// Get statistics without loading data
const stats = cardData.getStats();
console.log(`Total cards: ${stats.total}`);
\`\`\`

Generated: ${new Date().toISOString()}
