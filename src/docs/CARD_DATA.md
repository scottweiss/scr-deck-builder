
# Sorcery: Contested Realm - Card Data Documentation

## Overview
The card data system has been optimized for performance and maintainability. Instead of parsing CSV files at runtime,
we now use pre-processed JavaScript data files that are optimized for speed and memory usage.

## Card Data Files
- `sorceryCards.data.js` - Contains compressed card data (internal use only)
- `sorceryCards.optimized.js` - Main API for accessing card data with lazy loading

## Features
- **Lazy Loading**: Cards are loaded only when needed, reducing initial load time
- **Compression**: Card data is stored in a compressed format for smaller file size
- **Memoization**: Frequently accessed attributes are cached for better performance
- **Pre-filtering**: Foils, boosters, and other non-playable products are already filtered out

## Usage
```javascript
// Import the card data API
const cardData = require('./sorceryCards.optimized');

// Get all cards (lazy loaded the first time it's called)
const allCards = cardData.getAllCards();

// Get cards by set
const betaCards = cardData.getBetaCards();
const arthurianCards = cardData.getArthurianCards();

// Get processed cards with all attributes calculated
const processedCards = cardData.getProcessedCards(betaCards);

// Get card count
console.log(`Total cards: ${cardData.getCardCount()}`);
```

## Statistics
- Beta cards: 0
- Arthurian Legends cards: 0
- Total cards: 0
- Foils filtered: 0
- Boosters filtered: 0
- Size reduction: 0.00%

## Maintenance
To update the card data, modify the `processCards.js` script and run it again.
This will regenerate the data files with the latest information.

```
node processCards.js
```
