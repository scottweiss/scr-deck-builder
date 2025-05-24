#!/usr/bin/env node

// Debug utility artifact availability and selection
const fs = require('fs');

async function checkUtilityArtifacts() {
    try {
        console.log('🔍 Checking utility artifact availability in database...\n');
        
        // Check the processed card data
        const cardData = require('./dist/data/processed/sorceryCards.compressed.js');
        const cards = cardData.cards || cardData.default || cardData;
        
        console.log(`Total cards loaded: ${cards.length}\n`);
        
        // Find utility artifacts
        const utilityPatterns = [
            'ring of morrigan',
            'amulet of niniane', 
            'philosopher\'s stone',
            'amethyst core',
            'onyx core',
            'ruby core',
            'aquamarine core'
        ];
        
        console.log('🎯 Searching for utility artifacts in database:\n');
        
        const foundUtilities = [];
        
        utilityPatterns.forEach(pattern => {
            const found = cards.filter(card => {
                const name = (card.name || '').toLowerCase();
                const baseName = (card.baseName || '').toLowerCase();
                return name.includes(pattern) || baseName.includes(pattern);
            });
            
            if (found.length > 0) {
                console.log(`✅ ${pattern.toUpperCase()}:`);
                found.forEach(card => {
                    console.log(`   - ${card.name} (Cost: ${card.mana_cost || 0}, Type: ${card.type || 'Unknown'})`);
                    foundUtilities.push(card);
                });
            } else {
                console.log(`❌ ${pattern.toUpperCase()}: Not found`);
            }
            console.log('');
        });
        
        console.log(`📊 Total utility artifacts found: ${foundUtilities.length}`);
        
        // Check artifact distribution
        const allArtifacts = cards.filter(card => 
            (card.type || '').toLowerCase().includes('artifact')
        );
        
        console.log(`📦 Total artifacts in database: ${allArtifacts.length}`);
        console.log(`🎯 Utility rate: ${((foundUtilities.length / allArtifacts.length) * 100).toFixed(1)}%`);
        
        // Show cost distribution
        console.log('\n💰 Utility artifact cost distribution:');
        const costDistribution = {};
        foundUtilities.forEach(card => {
            const cost = card.mana_cost || 0;
            costDistribution[cost] = (costDistribution[cost] || 0) + 1;
        });
        
        Object.entries(costDistribution).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([cost, count]) => {
            console.log(`   ${cost} mana: ${count} cards`);
        });
        
    } catch (error) {
        console.error('Error checking utility artifacts:', error);
    }
}

checkUtilityArtifacts();
