/**
 * Generate real card data for browser deck builder
 * 
 * This script reads the processed Sorcery card data and converts it
 * into a browser-compatible format for the deck builder.
 */

const fs = require('fs');
const path = require('path');

// Import the generated card data
const compressedData = require('../../src/data/processed/sorceryCards.compressed.js');

console.log('Generating browser-compatible card data from real Sorcery cards...');
console.log(`Total cards available: ${compressedData.cards.length}`);

/**
 * Decompress a single card from array format back to object
 */
function decompressCard(cardArray) {
    const card = {};
    compressedData.keys.forEach((key, index) => {
        if (cardArray[index] !== null) {
            card[key] = cardArray[index];
        }
    });
    return card;
}

/**
 * Transform raw card data to browser-compatible format
 */
function transformCardForBrowser(rawCard) {
    const card = {
        name: rawCard.name || 'Unknown Card',
        type: mapCardType(rawCard.extCardType),
        elements: parseElements(rawCard.extElement),
        mana_cost: parseCost(rawCard.extCost),
        rule_text: rawCard.extDescription || '',
        rarity: rawCard.extRarity || 'Ordinary',
        set: rawCard.setName || 'Unknown',
        archetype: inferArchetype(rawCard),
        power: parseInt(rawCard.extPowerRating) || 0,
        life: parseInt(rawCard.extLife) || 0,
        defense: parseInt(rawCard.extDefensePower) || 0,
        threshold: rawCard.extThreshold || '',
        subtype: rawCard.extCardSubtype || '',
        flavor_text: rawCard.extFlavorText || ''
    };
    
    return card;
}

/**
 * Map card types from raw data to standard format
 */
function mapCardType(extCardType) {
    if (!extCardType) return 'Unknown';
    
    const typeMap = {
        'Magic': 'Magic',
        'Minion': 'Minion', 
        'Artifact': 'Artifact',
        'Site': 'Site',
        'Avatar': 'Avatar',
        'Aura': 'Aura'
    };
    
    return typeMap[extCardType] || 'Unknown';
}

/**
 * Parse elements from string format
 */
function parseElements(elementStr) {
    if (!elementStr) return [];
    
    const elementMap = {
        'Water': 'Water',
        'Fire': 'Fire', 
        'Earth': 'Earth',
        'Air': 'Air',
        'Void': 'Void'
    };
    
    // Handle multiple elements separated by commas
    const elements = elementStr.split(',').map(e => e.trim());
    return elements.map(e => elementMap[e]).filter(e => e);
}

/**
 * Parse mana cost from string
 */
function parseCost(costStr) {
    if (!costStr || costStr === 'X') return 0;
    const cost = parseInt(costStr);
    return isNaN(cost) ? 0 : cost;
}

/**
 * Infer archetype based on card properties
 */
function inferArchetype(rawCard) {
    const archetypes = [];
    const cost = parseCost(rawCard.extCost);
    const description = (rawCard.extDescription || '').toLowerCase();
    const type = rawCard.extCardType;
    
    // Low cost cards tend to be aggro
    if (cost <= 2 && type === 'Minion') {
        archetypes.push('Aggro');
    }
    
    // High cost cards tend to be control
    if (cost >= 5) {
        archetypes.push('Control');
    }
    
    // Medium cost cards are often midrange
    if (cost >= 3 && cost <= 4 && type === 'Minion') {
        archetypes.push('Midrange');
    }
    
    // Cards with complex effects might be combo
    if (description.includes('whenever') || description.includes('when') || description.includes('may')) {
        archetypes.push('Combo');
    }
    
    // Sites are typically utility/control
    if (type === 'Site') {
        archetypes.push('Control');
    }
    
    // Magic spells can be various archetypes
    if (type === 'Magic') {
        if (cost <= 3) archetypes.push('Aggro');
        else archetypes.push('Control');
    }
    
    return archetypes.length > 0 ? archetypes : ['Midrange'];
}

/**
 * Filter cards suitable for deck building (exclude non-playable cards)
 */
function filterPlayableCards(cards) {
    return cards.filter(card => {
        // Exclude boosters, foils, and other non-playable items
        const name = card.name.toLowerCase();
        return !name.includes('booster') &&
               !name.includes('foil') &&
               !name.includes('display') &&
               !name.includes('pack') &&
               card.type !== 'Unknown' &&
               card.mana_cost >= 0 &&
               card.rule_text.length > 0;
    });
}

// Process all cards
console.log('Decompressing and transforming cards...');
const allRawCards = compressedData.cards.map(decompressCard);
const transformedCards = allRawCards.map(transformCardForBrowser);
const playableCards = filterPlayableCards(transformedCards);

console.log(`Transformed ${transformedCards.length} cards`);
console.log(`Filtered to ${playableCards.length} playable cards`);

// Generate statistics
const stats = {
    totalCards: playableCards.length,
    cardTypes: {},
    elements: {},
    rarities: {},
    sets: {},
    manaCurve: {}
};

playableCards.forEach(card => {
    // Count by type
    stats.cardTypes[card.type] = (stats.cardTypes[card.type] || 0) + 1;
    
    // Count by rarity
    stats.rarities[card.rarity] = (stats.rarities[card.rarity] || 0) + 1;
    
    // Count by set
    stats.sets[card.set] = (stats.sets[card.set] || 0) + 1;
    
    // Count by mana cost
    const cost = Math.min(card.mana_cost, 8); // Cap at 8+ for curve
    const costKey = cost >= 8 ? '8+' : cost.toString();
    stats.manaCurve[costKey] = (stats.manaCurve[costKey] || 0) + 1;
    
    // Count elements
    card.elements.forEach(element => {
        stats.elements[element] = (stats.elements[element] || 0) + 1;
    });
});

console.log('\nCard Statistics:');
console.log('Types:', stats.cardTypes);
console.log('Elements:', stats.elements);
console.log('Rarities:', stats.rarities);
console.log('Sets:', stats.sets);
console.log('Mana Curve:', stats.manaCurve);

// Generate the browser-compatible JavaScript file
const browserCardData = `/**
 * Real Sorcery: Contested Realm Card Data
 * 
 * Generated from actual CSV data on ${new Date().toISOString()}
 * Total cards: ${playableCards.length}
 * 
 * Source files:
 * - BetaProductsAndPrices.csv (${stats.sets.Beta || 0} cards)
 * - ArthurianLegendsProductsAndPrices.csv (${stats.sets.ArthurianLegends || 0} cards)
 */

const REAL_SORCERY_CARDS = ${JSON.stringify(playableCards, null, 2)};

const CARD_STATISTICS = ${JSON.stringify(stats, null, 2)};

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cards: REAL_SORCERY_CARDS,
        stats: CARD_STATISTICS,
        getCardsByType: (type) => REAL_SORCERY_CARDS.filter(card => card.type === type),
        getCardsByElement: (element) => REAL_SORCERY_CARDS.filter(card => card.elements.includes(element)),
        getCardsBySet: (set) => REAL_SORCERY_CARDS.filter(card => card.set === set),
        getCardsByCost: (cost) => REAL_SORCERY_CARDS.filter(card => card.mana_cost === cost)
    };
} else {
    // Browser environment
    window.REAL_SORCERY_CARDS = REAL_SORCERY_CARDS;
    window.CARD_STATISTICS = CARD_STATISTICS;
}
`;

// Write the file
const outputPath = path.join(__dirname, 'real-card-data.js');
fs.writeFileSync(outputPath, browserCardData);

console.log(`\nGenerated real card data file: ${path.basename(outputPath)}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

// Show sample cards
console.log('\nSample cards:');
const sampleCards = playableCards.slice(0, 3);
sampleCards.forEach((card, index) => {
    console.log(`\n${index + 1}. ${card.name} (${card.type})`);
    console.log(`   Cost: ${card.mana_cost}, Elements: [${card.elements.join(', ')}]`);
    console.log(`   Rarity: ${card.rarity}, Set: ${card.set}`);
    console.log(`   Text: ${card.rule_text.substring(0, 80)}${card.rule_text.length > 80 ? '...' : ''}`);
});

console.log('\n✅ Real card data generation complete!');
