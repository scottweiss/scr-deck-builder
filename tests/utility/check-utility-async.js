const cards = require('./dist/data/processed/sorceryCards');

async function checkUtilityCards() {
    console.log('Loading cards...');
    const allCards = await cards.getAllCards();
    console.log('Total cards loaded:', allCards.length);
    
    // Check for artifacts
    const artifacts = allCards.filter(c => c.type === 'Artifact');
    console.log('\nArtifacts found:', artifacts.length);
    
    // Look for our target utility cards
    const targetUtilityCards = [
        'ring of morrigan',
        'amulet of niniane',
        'philosopher\'s stone',
        'amethyst core',
        'onyx core', 
        'ruby core',
        'aquamarine core'
    ];
    
    console.log('\nSearching for target utility cards:');
    
    for (const targetName of targetUtilityCards) {
        const found = allCards.filter(card => {
            const name = (card.baseName || card.name || '').toLowerCase();
            return name.includes(targetName.replace(' core', '').replace('\'s', ''));
        });
        
        if (found.length > 0) {
            console.log(`✓ Found ${targetName}:`);
            found.forEach(card => {
                console.log(`  - ${card.name} (${card.type}, Cost: ${card.mana_cost})`);
                console.log(`    Text: ${(card.text || '').substring(0, 80)}...`);
            });
        } else {
            console.log(`❌ Not found: ${targetName}`);
        }
        console.log('');
    }
    
    // Also show all artifacts for reference
    console.log('\nAll artifacts in database:');
    artifacts.forEach(artifact => {
        console.log(`- ${artifact.name} (Cost: ${artifact.mana_cost}) - ${(artifact.text || '').substring(0, 60)}...`);
    });
}

checkUtilityCards().catch(console.error);
