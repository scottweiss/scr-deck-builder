// Quick test of the deck builder functionality
const path = require('path');

// Change to the deck-builder directory to test
process.chdir('/Users/scott/dev/scr/web/deck-builder');

// Mock the compressed data since we're in Node.js
global.loadCompressedData = () => {
    // Return mock data for testing
    return {
        keys: ['name', 'type', 'elements', 'mana_cost', 'rule_text', 'archetype'],
        cards: [
            // Mock sites
            ['Crystal Lake', 'Site', ['Water'], 0, 'Tap: Add Water mana to your pool.', []],
            ['Volcanic Peak', 'Site', ['Fire'], 0, 'Tap: Add Fire mana to your pool.', []],
            ['Ancient Grove', 'Site', ['Earth'], 0, 'Tap: Add Earth mana to your pool.', []],
            ['Storm Clouds', 'Site', ['Air'], 0, 'Tap: Add Air mana to your pool.', []],
            ['Void Rift', 'Site', ['Void'], 0, 'Tap: Add Void mana to your pool.', []],
            ['Mystic Gardens', 'Site', ['Water', 'Earth'], 0, 'Tap: Add Water or Earth mana.', []],
            ['Elemental Nexus', 'Site', ['Fire', 'Air'], 0, 'Tap: Add Fire or Air mana.', []],
            ['Sacred Spring', 'Site', ['Water'], 0, 'Tap: Add Water mana. Gain 1 life.', []],
            ['Lava Flow', 'Site', ['Fire'], 0, 'Tap: Add Fire mana. Deal 1 damage.', []],
            ['Forest Shrine', 'Site', ['Earth'], 0, 'Tap: Add Earth mana. Draw if you control 3+ creatures.', []],
            // Mock spells
            ['Water Elemental', 'Minion', ['Water'], 3, 'When summoned, draw a card.', ['Control']],
            ['Fire Sprite', 'Minion', ['Fire'], 2, 'Haste. Deal 1 damage when summoned.', ['Aggro']],
            ['Lightning Bolt', 'Magic', ['Fire'], 1, 'Deal 3 damage to any target.', ['Aggro']],
            ['Counterspell', 'Magic', ['Water'], 2, 'Counter target spell.', ['Control']],
            ['Healing Potion', 'Magic', ['Earth'], 2, 'Restore 5 health to any target.', ['Control']],
            // Mock avatars
            ['Merlin', 'Avatar', ['Water'], 0, 'At the beginning of your turn, draw an additional card.', ['Control']]
        ]
    };
};

// Load the deck builder
const RealSorceryDeckBuilder = require('./real-deck-builder.js');

async function testDeckBuilder() {
    console.log('🔨 Testing RealSorceryDeckBuilder...');
    
    try {
        const deckBuilder = new RealSorceryDeckBuilder();
        
        console.log('📊 Loading card data...');
        await deckBuilder.loadCardData();
        
        console.log(`✅ Loaded ${deckBuilder.cards.length} cards, ${deckBuilder.sites.length} sites, ${deckBuilder.avatars.length} avatars`);
        
        console.log('🗺️ Sites loaded:');
        deckBuilder.sites.forEach((site, index) => {
            console.log(`  ${index + 1}. ${site.name} (${site.elements.join(', ')})`);
        });
        
        console.log('\n🔨 Building deck...');
        const result = await deckBuilder.buildDeck({
            preferredElements: ['Water'],
            preferredArchetype: 'Control'
        });
        
        console.log('✅ Deck built successfully!');
        console.log(`📊 Stats: ${result.stats.totalCards} total, ${result.stats.spellsCount} spells, ${result.stats.sitesCount} sites`);
        
        console.log('\n🗺️ Sites in deck:');
        result.sites.forEach((site, index) => {
            console.log(`  ${index + 1}. ${site.name} (${site.elements.join(', ')})`);
        });
        
        console.log('\n📚 Sample spells:');
        result.spells.slice(0, 5).forEach((spell, index) => {
            console.log(`  ${index + 1}. ${spell.name} (${spell.mana_cost} mana, ${spell.elements.join(', ')})`);
        });
        
        if (result.sites.length === 0) {
            console.log('❌ ERROR: No sites were generated!');
        } else {
            console.log('✅ Sites were generated successfully!');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testDeckBuilder();
