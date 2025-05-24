const { loadCards } = require('./dist/data/processed/cardLoader');

async function findUtilityCards() {
    console.log('Searching for utility cards in the database...\n');
    
    const allCards = await loadCards();
    
    const targetUtilityCards = [
        'ring of morrigan',
        'amulet of niniane',
        'philosopher\'s stone',
        'amethyst core',
        'onyx core',
        'ruby core',
        'aquamarine core'
    ];
    
    console.log('Looking for target utility cards:\n');
    
    const foundUtilities = [];
    
    for (const utilityName of targetUtilityCards) {
        const found = allCards.filter(card => {
            const name = (card.baseName || card.name || '').toLowerCase();
            return name.includes(utilityName.replace(' core', '').replace('\'s', ''));
        });
        
        if (found.length > 0) {
            console.log(`✓ Found ${utilityName}:`);
            found.forEach(card => {
                console.log(`  - ${card.name} (${card.type}) - ${card.text?.substring(0, 80)}...`);
                foundUtilities.push(card);
            });
            console.log('');
        } else {
            console.log(`❌ Missing: ${utilityName}`);
        }
    }
    
    console.log(`\nTotal utility cards found: ${foundUtilities.length}`);
    
    // Let's also check what artifacts are available
    const artifacts = allCards.filter(card => 
        card.type?.toLowerCase() === 'artifact'
    );
    
    console.log(`\nTotal artifacts available: ${artifacts.length}`);
    console.log('\nAll artifacts in database:');
    artifacts.forEach(card => {
        console.log(`  - ${card.name} (Cost: ${card.mana_cost}) - ${card.text?.substring(0, 60)}...`);
    });
}

findUtilityCards().catch(console.error);
