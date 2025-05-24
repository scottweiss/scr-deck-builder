// Test specific combo patterns we added
const COMPRESSED_CARD_DATA = require('./dist/data/processed/sorceryCards.compressed.js');
const { identifyCardCombos } = require('./dist/core/cards/cardCombos.js');

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

async function testSpecificCombos() {
    console.log('Testing Specific New Combo Patterns...\n');
    
    const allCards = COMPRESSED_CARD_DATA.cards.map(decompressCard);
    console.log(`Total cards: ${allCards.length}\n`);
    
    // Test Lance cards
    const lanceCards = allCards.filter(card => 
        card.text.toLowerCase().includes('lance') || 
        card.type.toLowerCase().includes('lance'));
    console.log(`Lance cards found: ${lanceCards.length}`);
    lanceCards.slice(0, 3).forEach(card => 
        console.log(`  - ${card.name}: ${card.text}`));
    
    // Test Projectile cards
    const projectileCards = allCards.filter(card => 
        card.text.toLowerCase().includes('projectile'));
    console.log(`\nProjectile cards found: ${projectileCards.length}`);
    projectileCards.slice(0, 3).forEach(card => 
        console.log(`  - ${card.name}: ${card.text}`));
    
    // Test Spellcaster cards
    const spellcasterCards = allCards.filter(card => 
        card.text.toLowerCase().includes('spellcaster'));
    console.log(`\nSpellcaster cards found: ${spellcasterCards.length}`);
    spellcasterCards.slice(0, 3).forEach(card => 
        console.log(`  - ${card.name}: ${card.text}`));
    
    // Test Curse cards
    const curseCards = allCards.filter(card => 
        card.text.toLowerCase().includes('curse'));
    console.log(`\nCurse cards found: ${curseCards.length}`);
    curseCards.slice(0, 3).forEach(card => 
        console.log(`  - ${card.name}: ${card.text}`));
    
    // Test Aura cards
    const auraCards = allCards.filter(card => 
        card.text.toLowerCase().includes('aura') || 
        card.subtype.toLowerCase().includes('aura'));
    console.log(`\nAura cards found: ${auraCards.length}`);
    auraCards.slice(0, 3).forEach(card => 
        console.log(`  - ${card.name}: ${card.text}`));
    
    // Test Position/Back Row cards
    const positionCards = allCards.filter(card => 
        card.text.toLowerCase().includes('back row') ||
        card.text.toLowerCase().includes('position'));
    console.log(`\nPosition cards found: ${positionCards.length}`);
    positionCards.slice(0, 3).forEach(card => 
        console.log(`  - ${card.name}: ${card.text}`));
    
    // Test Mutation cards
    const mutationCards = allCards.filter(card => 
        card.text.toLowerCase().includes('random') ||
        card.text.toLowerCase().includes('mutation'));
    console.log(`\nMutation/Random cards found: ${mutationCards.length}`);
    mutationCards.slice(0, 3).forEach(card => 
        console.log(`  - ${card.name}: ${card.text}`));
    
    console.log('\n=== Running Full Combo Detection ===\n');
    
    // Run combo detection on all cards
    const combos = identifyCardCombos(allCards);
    console.log(`Total combos found: ${combos.length}\n`);
    
    // Show combos by type
    const combosByName = {};
    combos.forEach(combo => {
        if (!combosByName[combo.name]) {
            combosByName[combo.name] = [];
        }
        combosByName[combo.name].push(combo);
    });
    
    Object.keys(combosByName).sort().forEach(comboName => {
        const comboList = combosByName[comboName];
        console.log(`${comboName}: ${comboList[0].synergy} synergy points`);
        console.log(`  Cards: ${comboList[0].cards.length}`);
        console.log(`  Description: ${comboList[0].description}`);
        console.log('');
    });
}

testSpecificCombos().catch(console.error);
