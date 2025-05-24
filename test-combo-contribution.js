const { calculateSynergy } = require('./dist/analyses/synergy/synergyCalculator');
const { loadCards } = require('./dist/data/processed/cardLoader');

async function testComboContribution() {
    console.log('Testing Enhanced Combo Contribution Calculation...\n');
    
    const allCards = await loadCards();
    
    // Create a deck with some utility cards already in it
    const baseUtilityCards = [
        'amethyst core',
        'ruby core',
        'philosopher\'s stone'
    ];
    
    const baseDeck = allCards.filter(card => {
        const name = (card.baseName || card.name || '').toLowerCase();
        return baseUtilityCards.includes(name);
    });
    
    console.log('Base deck with utility cards:');
    baseDeck.forEach(card => {
        console.log(`- ${card.name} (${card.baseName})`);
    });
    
    // Test adding more utility cards to see synergy scores
    const testUtilityCards = [
        'ring of morrigan',
        'amulet of niniane',
        'onyx core',
        'aquamarine core'
    ];
    
    console.log('\nTesting synergy scores for additional utility cards:\n');
    
    for (const utilityName of testUtilityCards) {
        const utilityCard = allCards.find(card => {
            const name = (card.baseName || card.name || '').toLowerCase();
            return name === utilityName;
        });
        
        if (utilityCard) {
            const synergyScore = calculateSynergy(utilityCard, baseDeck);
            console.log(`${utilityCard.name}:`);
            console.log(`  Synergy Score: ${synergyScore.toFixed(2)}`);
            console.log(`  Expected to complete/enhance High-Value Utility Synergy combo`);
            console.log('');
        } else {
            console.log(`❌ Could not find utility card: ${utilityName}`);
        }
    }
    
    // Test with a non-utility card for comparison
    const nonUtilityCard = allCards.find(card => {
        const name = (card.baseName || card.name || '').toLowerCase();
        return name.includes('soldier') || name.includes('warrior');
    });
    
    if (nonUtilityCard) {
        const synergyScore = calculateSynergy(nonUtilityCard, baseDeck);
        console.log(`Comparison - Non-utility card (${nonUtilityCard.name}):`);
        console.log(`  Synergy Score: ${synergyScore.toFixed(2)}`);
        console.log('  Should have much lower synergy with utility deck');
        console.log('');
    }
    
    console.log('Enhanced combo contribution test completed!');
}

testComboContribution().catch(console.error);
