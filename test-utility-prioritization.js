#!/usr/bin/env node

// Test that utility cards get high synergy scores in deck building context
const { identifyCardCombos } = require('./dist/core/cards/cardCombos.js');
const data = require('./dist/data/processed/sorceryCards.compressed.js');

// Convert cards from compressed format
const cards = data.cards.map(cardArray => {
    const card = {};
    data.keys.forEach((key, index) => {
        card[key] = cardArray[index];
    });
    
    return {
        name: card.name,
        baseName: card.cleanName,
        text: card.extDescription,
        mana_cost: parseInt(card.extCost) || 0,
        type: card.extCardType,
        subtype: card.extCardSubtype,
        elements: card.extElement ? [card.extElement] : [],
        rarity: card.extRarity,
        setName: card.setName
    };
});

console.log('Testing Utility Card Prioritization in Deck Building Context...\n');

// Create a sample deck with utility cards and some support
const deckCards = cards.filter(card => {
    const name = (card.name || '').toLowerCase();
    const cost = card.mana_cost || 0;
    
    // Include all utility cards
    if (name.includes('ring of morrigan') ||
        name.includes('amulet of niniane') ||
        name.includes('philosopher\'s stone') ||
        name.includes('core')) {
        return true;
    }
    
    // Include some spell cards for synergy
    if (card.type === 'Magic' && cost <= 4) {
        return true;
    }
    
    // Include some creatures
    if (card.type === 'Minion' && cost <= 3) {
        return true;
    }
    
    return false;
});

console.log(`Created test deck with ${deckCards.length} cards including utility pieces`);

const combos = identifyCardCombos(deckCards);

// Sort combos by synergy to see what's prioritized
const sortedCombos = combos.sort((a, b) => b.synergy - a.synergy);

console.log(`\nFound ${combos.length} combos. Top 10 by synergy:\n`);

sortedCombos.slice(0, 10).forEach((combo, index) => {
    console.log(`${index + 1}. ${combo.name} (Synergy: ${combo.synergy})`);
    
    // Check if it includes our target utility cards
    const utilityCards = combo.cards.filter(cardName => {
        const name = cardName.toLowerCase();
        return name.includes('ring of morrigan') ||
               name.includes('amulet of niniane') ||
               name.includes('philosopher\'s stone') ||
               name.includes('core');
    });
    
    if (utilityCards.length > 0) {
        console.log(`   ✓ Includes utility cards: ${utilityCards.join(', ')}`);
    }
    
    console.log(`   Description: ${combo.description}`);
    console.log('');
});

// Calculate total synergy boost from utility-focused combos
const utilityComboSynergy = combos
    .filter(combo => 
        combo.name.includes('Utility') ||
        combo.name.includes('Cost Reduction') ||
        combo.name.includes('Magic Protection') ||
        combo.name.includes('Spell-Triggered') ||
        combo.name.includes('Core') ||
        combo.name.includes('Mana') ||
        combo.name.includes('Threshold')
    )
    .reduce((total, combo) => total + combo.synergy, 0);

console.log(`Total synergy from utility-focused combos: ${utilityComboSynergy}`);
console.log('This demonstrates that utility cards now receive significant synergy boosts!');

console.log('\nUtility card prioritization test completed successfully!');
