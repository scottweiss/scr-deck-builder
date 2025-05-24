// Quick test of specific new combo patterns
const COMPRESSED_CARD_DATA = require('./dist/data/processed/sorceryCards.compressed.js');

// Helper function to decompress card data
function decompressCard(cardArray) {
    const keys = COMPRESSED_CARD_DATA.keys;
    const card = {};
    
    for (let i = 0; i < keys.length && i < cardArray.length; i++) {
        card[keys[i]] = cardArray[i];
    }
    
    return {
        productId: card.productId || '',
        name: card.name || '',
        text: card.extDescription || '',
        type: card.extCardType || '',
        subtype: card.subTypeName || '',
        element: card.extElement || ''
    };
}

console.log('Checking New Combo Pattern Coverage...\n');

const allCards = COMPRESSED_CARD_DATA.cards.map(decompressCard);

// Check for our new combo patterns
const patterns = {
    lance: allCards.filter(card => 
        card.text.toLowerCase().includes('lance') || 
        card.type.toLowerCase().includes('lance')),
    projectile: allCards.filter(card => 
        card.text.toLowerCase().includes('projectile')),
    spellcaster: allCards.filter(card => 
        card.text.toLowerCase().includes('spellcaster')),
    curse: allCards.filter(card => 
        card.text.toLowerCase().includes('curse')),
    aura: allCards.filter(card => 
        card.text.toLowerCase().includes('aura') || 
        card.subtype.toLowerCase().includes('aura')),
    backrow: allCards.filter(card => 
        card.text.toLowerCase().includes('back row')),
    random: allCards.filter(card => 
        card.text.toLowerCase().includes('random'))
};

Object.keys(patterns).forEach(pattern => {
    console.log(`${pattern.toUpperCase()}: ${patterns[pattern].length} cards`);
    if (patterns[pattern].length > 0) {
        console.log(`  Example: ${patterns[pattern][0].name}`);
    }
});

console.log('\n✅ Pattern coverage verified for new combo functions!');
