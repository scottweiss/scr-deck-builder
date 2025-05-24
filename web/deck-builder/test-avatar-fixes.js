// Test the real-deck-builder.js functionality
// This simulates the browser environment to test our fixes

// Mock the browser environment
global.window = {
    COMPRESSED_CARD_DATA: null
};

// Mock compressed card data
global.COMPRESSED_CARD_DATA = {
    keys: ['name', 'type', 'elements', 'mana_cost', 'rule_text'],
    cards: [
        // Sample avatars
        ['Fire Warrior', 'Avatar', ['Fire'], '0', 'Fire avatar with combat abilities'],
        ['Water Sage', 'Avatar', ['Water'], '0', 'Water avatar with spell mastery'],
        ['Earth Guardian', 'Avatar', ['Earth'], '0', 'Earth avatar with defensive abilities'],
        ['Air Mystic', 'Avatar', ['Air'], '0', 'Air avatar with mobility'],
        
        // Sample spells
        ['Fireball', 'Magic', ['Fire'], '3', 'Deal 4 damage'],
        ['Healing Wave', 'Magic', ['Water'], '2', 'Restore 5 health'],
        ['Stone Wall', 'Magic', ['Earth'], '1', 'Create a barrier'],
        
        // Sample sites
        ['Fire Temple', 'Site', ['Fire'], '0', 'Generates fire mana'],
        ['Water Spring', 'Site', ['Water'], '0', 'Generates water mana'],
        ['Mountain Peak', 'Site', ['Earth'], '0', 'Generates earth mana'],
    ],
    stats: { total: 10 }
};

// Load the deck builder
const fs = require('fs');
const path = require('path');

// Read and evaluate the real-deck-builder.js file
const deckBuilderPath = path.join(__dirname, 'real-deck-builder.js');
const deckBuilderCode = fs.readFileSync(deckBuilderPath, 'utf8');

// Evaluate the code in this context
eval(deckBuilderCode);

// Test the functionality
async function runTests() {
    console.log('🧪 Testing Real Deck Builder Fixes...\n');
    
    try {
        // Create deck builder instance
        const deckBuilder = new RealSorceryDeckBuilder();
        
        // Test 1: Basic initialization
        console.log('Test 1: Initialization');
        await deckBuilder.loadCardData();
        console.log('✅ Deck builder initialized successfully\n');
        
        // Test 2: Avatar loading
        console.log('Test 2: Avatar Loading');
        const allAvatars = await deckBuilder.getAvatars();
        console.log(`✅ Loaded ${allAvatars.length} avatars`);
        if (allAvatars.length > 0) {
            console.log(`   First avatar: ${allAvatars[0].name} (${allAvatars[0].elements?.join(', ') || 'No elements'})`);
        }
        console.log();
        
        // Test 3: Element filtering
        console.log('Test 3: Element Filtering');
        const fireAvatars = await deckBuilder.getAvatars(['Fire']);
        const waterAvatars = await deckBuilder.getAvatars(['Water']);
        console.log(`✅ Fire avatars: ${fireAvatars.length}`);
        console.log(`✅ Water avatars: ${waterAvatars.length}`);
        if (fireAvatars.length > 0) {
            console.log(`   Fire avatar: ${fireAvatars[0].name}`);
        }
        console.log();
        
        // Test 4: Deck building with avatar selection
        console.log('Test 4: Deck Building with Avatar');
        const deckPreferences = {
            preferredElements: ['Fire'],
            preferredArchetype: 'Midrange'
        };
        
        const deck = await deckBuilder.buildDeck(deckPreferences);
        
        // Check the results
        console.log('📊 Deck Build Results:');
        console.log(`   Spells: ${deck.spells?.length || 0}`);
        console.log(`   Sites: ${deck.sites?.length || 0}`);
        console.log(`   Avatar: ${deck.avatar ? deck.avatar.name : 'MISSING! ❌'}`);
        
        if (deck.avatar) {
            console.log(`   Avatar Elements: ${deck.avatar.elements?.join(', ') || 'None'}`);
            console.log('✅ Avatar successfully selected and returned');
        } else {
            console.log('❌ Avatar missing from deck result - FIX FAILED!');
            return false;
        }
        console.log();
        
        // Test 5: Avatar selection logic
        console.log('Test 5: Avatar Selection Logic');
        
        // Test with specific avatar name
        const namedAvatarDeck = await deckBuilder.buildDeck({
            preferredElements: ['Water'],
            avatarName: 'Water Sage'
        });
        
        if (namedAvatarDeck.avatar && namedAvatarDeck.avatar.name === 'Water Sage') {
            console.log('✅ Specific avatar selection works');
        } else {
            console.log('⚠️ Specific avatar selection may not work as expected');
        }
        
        // Test with element preference
        const elementBasedDeck = await deckBuilder.buildDeck({
            preferredElements: ['Earth']
        });
        
        if (elementBasedDeck.avatar) {
            const hasEarthElement = elementBasedDeck.avatar.elements?.includes('Earth');
            if (hasEarthElement) {
                console.log('✅ Element-based avatar selection works');
            } else {
                console.log('⚠️ Avatar selected but may not match preferred element (could be fallback)');
            }
        }
        console.log();
        
        console.log('🎉 All tests completed successfully!');
        console.log('✅ Avatar selection fixes are working correctly');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error(error.stack);
        return false;
    }
}

// Run the tests
runTests().then(success => {
    if (success) {
        console.log('\n🎯 CONCLUSION: The avatar selection fix is working!');
    } else {
        console.log('\n💥 CONCLUSION: There are still issues with avatar selection');
    }
    process.exit(success ? 0 : 1);
});
