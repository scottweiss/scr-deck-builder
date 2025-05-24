#!/usr/bin/env node

// Quick diagnostic script to check card loading status
console.log('🔍 SCR Card Loading Diagnostic\n');

async function checkCardLoading() {
    try {
        console.log('1. Checking compressed data file...');
        const compressedData = require('./dist/data/processed/sorceryCards.compressed.js');
        console.log(`   ✅ Compressed file loaded: ${compressedData.cards.length} cards, ${compressedData.keys.length} keys\n`);
        
        console.log('2. Testing sorceryCards module...');
        const sorceryCards = require('./dist/data/processed/sorceryCards.js');
        const cards = await sorceryCards.getAllCards();
        console.log(`   ✅ Module loaded: ${cards.length} cards\n`);
        
        if (cards.length > 0) {
            const firstCard = cards[0];
            console.log('3. Sample card data:');
            console.log(`   Name: ${firstCard.name}`);
            console.log(`   Type: ${firstCard.type}`);
            console.log(`   Elements: ${JSON.stringify(firstCard.elements)}`);
            console.log(`   Threshold: ${firstCard.threshold}\n`);
        }
        
        console.log('4. Testing utils readCardData...');
        const utils = require('./dist/utils/utils.js');
        const utilCards = await utils.readCardData(['Beta', 'ArthurianLegends']);
        console.log(`   ✅ Utils loaded: ${utilCards.length} cards\n`);
        
        console.log('✅ All systems operational!');
        
    } catch (error) {
        console.error('❌ Error during diagnostic:', error.message);
        console.error('Stack:', error.stack);
    }
}

checkCardLoading();
