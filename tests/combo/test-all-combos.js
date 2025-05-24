// Test all 26 combo detection functions
const COMPRESSED_CARD_DATA = require('./dist/data/processed/sorceryCards.compressed.js');
const { identifyCardCombos } = require('./dist/core/cards/cardCombos.js');

function decompressCard(cardArray) {
    const keys = COMPRESSED_CARD_DATA.keys;
    const card = {};
    
    for (let i = 0; i < keys.length && i < cardArray.length; i++) {
        card[keys[i]] = cardArray[i];
    }
    
    return {
        productId: card.productId || '',
        name: card.name || '',
        cleanName: card.cleanName || card.name || '',
        imageUrl: card.imageUrl || '',
        text: card.extDescription || '',
        type: card.extCardType || '',
        subtype: card.subTypeName || '',
        element: card.extElement || '',
        cost: card.extCost || '',
        threshold: card.extThreshold || '',
        rarity: card.extRarity || '',
        setName: card.setName || ''
    };
}

console.log('🎯 Testing All 26 Enhanced Combo Detection Functions\n');

// Test with a representative sample of 200 cards
const allCards = COMPRESSED_CARD_DATA.cards.map(decompressCard);
const testCards = allCards.slice(0, 200);

console.log(`Testing with ${testCards.length} cards out of ${allCards.length} total cards\n`);

// Run combo detection
const combos = identifyCardCombos(testCards);

console.log(`✅ Found ${combos.length} combo patterns:\n`);

// Group combos by name and count unique types
const comboTypes = new Set();
const combosByType = {};

combos.forEach(combo => {
    comboTypes.add(combo.name);
    if (!combosByType[combo.name]) {
        combosByType[combo.name] = {
            synergy: combo.synergy,
            cardCount: combo.cards.length,
            description: combo.description
        };
    }
});

// Display results sorted by synergy score
const sortedCombos = Object.entries(combosByType)
    .sort(([,a], [,b]) => b.synergy - a.synergy);

sortedCombos.forEach(([name, data], index) => {
    console.log(`${index + 1}. ${name}`);
    console.log(`   Synergy: ${data.synergy} points`);
    console.log(`   Cards involved: ${data.cardCount}`);
    console.log(`   ${data.description}`);
    console.log('');
});

console.log(`🎉 Successfully detected ${comboTypes.size} different combo types!`);

// Show which new patterns we're detecting
const newPatterns = [
    'Lance Keyword Synergy',
    'Spellcaster Spell Interaction', 
    'Projectile Artillery',
    'Curse Avatar Targeting',
    'Aura Dispel Interaction',
    'Tactical Positioning',
    'Random Mutation Effects'
];

console.log('\n🆕 New Pattern Detection Status:');
newPatterns.forEach(pattern => {
    const found = Array.from(comboTypes).some(combo => 
        combo.toLowerCase().includes(pattern.toLowerCase().split(' ')[0]));
    console.log(`   ${found ? '✅' : '❌'} ${pattern}`);
});

console.log(`\n📊 Total combo detection functions: 26`);
console.log(`📈 Combo types detected in sample: ${comboTypes.size}`);
console.log(`🔥 Total synergy combinations found: ${combos.length}`);
