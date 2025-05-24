/**
 * Test the enhanced combo detection system
 */

// Import the compressed card data directly
const COMPRESSED_CARD_DATA = require('./dist/data/processed/sorceryCards.compressed.js');

// Import the combo detection
const { identifyCardCombos } = require('./dist/core/cards/cardCombos.js');

// Helper function to decompress card data
function decompressCard(cardArray) {
    const keys = COMPRESSED_CARD_DATA.keys;
    const card = {};
    
    for (let i = 0; i < keys.length && i < cardArray.length; i++) {
        card[keys[i]] = cardArray[i];
    }
    
    // Ensure we have required properties for combo detection
    if (!card.name) card.name = '';
    if (!card.extCardType) card.extCardType = '';
    if (!card.extElement) card.extElement = '';
    if (!card.extDescription) card.extDescription = '';
    if (!card.subTypeName) card.subTypeName = '';
    if (!card.extCost) card.extCost = '';
    if (!card.extThreshold) card.extThreshold = '';
    
    // Map to expected Card interface properties
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

// Helper function to get all card data
function getCardData() {
    return COMPRESSED_CARD_DATA.cards || [];
}

async function testComboDetection() {
    console.log('Testing Enhanced Combo Detection System...\n');
    
    try {
        // Get the compressed card data
        const compressedCards = getCardData();
        console.log(`Loaded ${compressedCards.length} cards from database\n`);
        
        // Decompress all cards to test with
        const testCards = compressedCards.map(decompressCard);
        
        console.log(`Testing combo detection with ${testCards.length} cards...\n`);
        
        // Run combo detection
        const combos = identifyCardCombos(testCards);
        
        console.log(`Found ${combos.length} combos:\n`);
        
        // Display found combos
        combos.forEach((combo, index) => {
            console.log(`${index + 1}. ${combo.name} (Synergy: ${combo.synergy})`);
            console.log(`   Cards: ${combo.cards.join(', ')}`);
            console.log(`   Description: ${combo.description}`);
            if (combo.strategy) {
                console.log(`   Strategy: ${combo.strategy}`);
            }
            console.log('');
        });
        
        // Test with cards that should have specific combos
        console.log('Testing with specific card combinations...\n');
        
        // Find cards with specific patterns
        const lanceCards = testCards.filter(card => 
            card.text && card.text.toLowerCase().includes('lance'));
        const spellcasterCards = testCards.filter(card => 
            card.text && card.text.toLowerCase().includes('spellcaster'));
        const lethalCards = testCards.filter(card => 
            card.text && card.text.toLowerCase().includes('lethal'));
        const projectileCards = testCards.filter(card => 
            card.text && card.text.toLowerCase().includes('projectile'));
        
        console.log(`Found ${lanceCards.length} Lance cards`);
        console.log(`Found ${spellcasterCards.length} Spellcaster cards`);
        console.log(`Found ${lethalCards.length} Lethal cards`);
        console.log(`Found ${projectileCards.length} Projectile cards`);
        
        // Test combo detection with these specific cards
        if (lanceCards.length > 0) {
            console.log('\nTesting Lance combo detection...');
            const lanceCombos = identifyCardCombos(lanceCards);
            console.log(`Found ${lanceCombos.length} Lance-related combos`);
        }
        
        if (spellcasterCards.length > 0) {
            console.log('\nTesting Spellcaster combo detection...');
            const spellcasterCombos = identifyCardCombos(spellcasterCards);
            console.log(`Found ${spellcasterCombos.length} Spellcaster-related combos`);
        }
        
        console.log('\nCombo detection test completed successfully!');
        
    } catch (error) {
        console.error('Error testing combo detection:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testComboDetection();
