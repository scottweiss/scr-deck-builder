#!/usr/bin/env node

// Test to verify that utility artifacts are being properly included in decks
const { buildSpellbook } = require('./dist/core/deck/deckBuilder.js');
const { loadSorceryCards } = require('./dist/main/build-deck.js');

async function testUtilityInclusion() {
    try {
        console.log('Testing utility artifact inclusion in deck building...\n');
        
        // Load the card data
        const cardData = await loadSorceryCards();
        console.log(`Loaded ${cardData.length} cards\n`);
        
        // Split by type
        let minions = [], artifacts = [], auras = [], magics = [];
        
        cardData.forEach(card => {
            const cardType = card.type;
            if (cardType.includes('Minion')) minions.push(card);
            else if (cardType.includes('Artifact')) artifacts.push(card);
            else if (cardType.includes('Aura')) auras.push(card);
            else if (cardType.includes('Magic')) magics.push(card);
        });
        
        // Build deck
        const options = {
            minions,
            artifacts,
            auras,
            magics,
            uniqueCards: [...minions, ...artifacts, ...auras, ...magics],
            avatar: null
        };
        
        const result = buildSpellbook(options);
        console.log(`Built deck with ${result.spells.length} cards\n`);
        
        // Check for utility artifacts specifically
        const utilityArtifacts = [
            'ring of morrigan',
            'amulet of niniane', 
            'philosopher\'s stone',
            'amethyst core',
            'onyx core',
            'ruby core',
            'aquamarine core'
        ];
        
        console.log('Checking for utility artifacts in final deck:\n');
        
        const foundUtilities = [];
        
        utilityArtifacts.forEach(utilityName => {
            const found = result.spells.find(card => 
                (card.baseName || '').toLowerCase().includes(utilityName)
            );
            
            if (found) {
                foundUtilities.push(found);
                console.log(`✅ Found: ${found.name}`);
            } else {
                console.log(`❌ Missing: ${utilityName}`);
            }
        });
        
        console.log(`\n📊 Utility Artifacts Included: ${foundUtilities.length}/${utilityArtifacts.length}`);
        
        // Count total artifacts in deck
        const totalArtifacts = result.spells.filter(card => 
            card.type && card.type.includes('Artifact')
        ).length;
        
        console.log(`📦 Total Artifacts in Deck: ${totalArtifacts}`);
        console.log(`🎯 Utility Artifact Rate: ${((foundUtilities.length / totalArtifacts) * 100).toFixed(1)}%`);
        
        // Show all artifacts for analysis
        console.log('\n🔍 All artifacts in deck:');
        result.spells
            .filter(card => card.type && card.type.includes('Artifact'))
            .forEach(card => {
                const isUtility = utilityArtifacts.some(name => 
                    (card.baseName || '').toLowerCase().includes(name)
                );
                const marker = isUtility ? '🔧' : '⚒️';
                console.log(`  ${marker} ${card.name} (Cost: ${card.mana_cost || 0})`);
            });
        
        console.log('\nUtility artifact inclusion test completed!');
        
    } catch (error) {
        console.error('Error in utility inclusion test:', error);
        console.error(error.stack);
    }
}

testUtilityInclusion();
