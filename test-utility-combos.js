#!/usr/bin/env node

// Test script specifically for utility combo detection
const { identifyCardCombos } = require('./dist/core/cards/cardCombos.js');
const data = require('./dist/data/processed/sorceryCards.compressed.js');

// Convert compressed array format back to objects
const cards = data.cards.map(cardArray => {
    const card = {};
    data.keys.forEach((key, index) => {
        card[key] = cardArray[index];
    });
    
    // Map to the expected Card interface properties
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

console.log('Testing Utility Combo Detection...\n');

// Filter for the specific utility cards we want to test
const utilityCards = cards.filter(card => {
    const name = (card.name || '').toLowerCase();
    return name.includes('ring of morrigan') ||
           name.includes('amulet of niniane') ||
           name.includes('philosopher\'s stone') ||
           name.includes('amethyst core') ||
           name.includes('onyx core') ||
           name.includes('ruby core') ||
           name.includes('aquamarine core');
});

console.log('Found utility cards:');
utilityCards.forEach(card => {
    console.log(`- ${card.name} (Cost: ${card.mana_cost || 0})`);
    if (card.text) {
        console.log(`  Text: ${card.text.substring(0, 100)}...`);
    }
});

console.log(`\nTesting combo detection with ${utilityCards.length} utility cards...\n`);

// Test combo detection with utility cards
const combos = identifyCardCombos(utilityCards);

console.log(`Found ${combos.length} utility-focused combos:\n`);

combos.forEach((combo, index) => {
    console.log(`${index + 1}. ${combo.name} (Synergy: ${combo.synergy})`);
    console.log(`   Cards: ${combo.cards.join(', ')}`);
    console.log(`   Description: ${combo.description}`);
    console.log(`   Strategy: ${combo.strategy}\n`);
});

// Test with a broader set including support cards
console.log('\n=== Testing with broader card set ===\n');

const supportCards = cards.filter(card => {
    const text = (card.text || '').toLowerCase();
    const name = (card.name || '').toLowerCase();
    const type = (card.type || '').toLowerCase();
    
    return name.includes('ring of morrigan') ||
           name.includes('amulet of niniane') ||
           name.includes('philosopher\'s stone') ||
           name.includes('core') ||
           text.includes('threshold') ||
           text.includes('mana') ||
           text.includes('spell') ||
           text.includes('bearer') ||
           text.includes('magic immunity') ||
           text.includes('cost') ||
           type.includes('artifact') ||
           (card.mana_cost !== undefined && card.mana_cost <= 2);
});

console.log(`Testing with ${supportCards.length} cards (utility + support)...\n`);

const broadCombos = identifyCardCombos(supportCards);

// Filter for utility-focused combos
const utilityFocusedCombos = broadCombos.filter(combo => 
    combo.name.includes('Utility') ||
    combo.name.includes('Cost Reduction') ||
    combo.name.includes('Magic Protection') ||
    combo.name.includes('Spell-Triggered') ||
    combo.name.includes('Mana') ||
    combo.name.includes('Threshold') ||
    combo.name.includes('Core') ||
    combo.name.includes('Artifact')
);

console.log(`Found ${utilityFocusedCombos.length} utility-focused combos:\n`);

utilityFocusedCombos.forEach((combo, index) => {
    console.log(`${index + 1}. ${combo.name} (Synergy: ${combo.synergy})`);
    console.log(`   Cards: ${combo.cards.slice(0, 10).join(', ')}${combo.cards.length > 10 ? '...' : ''}`);
    console.log(`   Description: ${combo.description}`);
    console.log(`   Strategy: ${combo.strategy}\n`);
});

console.log('Utility combo detection test completed!');
