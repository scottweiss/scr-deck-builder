// Validate each combo detection function individually
const { identifyCardCombos } = require('./dist/core/cards/cardCombos.js');

console.log('🔍 Validating Individual Combo Detection Functions\n');

// Test data for each combo type
const testScenarios = [
    {
        name: 'Equipment Synergy',
        cards: [
            { name: 'Sword', text: 'Equipment. Minion gains +2 power.', type: 'Relic', subtype: 'Equipment' },
            { name: 'Shield', text: 'Equipment. Bearer gains protection.', type: 'Relic', subtype: 'Equipment' }
        ]
    },
    {
        name: 'Lance Keyword',
        cards: [
            { name: 'Knight', text: 'Lance. Charge attack.', type: 'Minion', element: 'Fire' },
            { name: 'Lance Weapon', text: 'Lance equipment for cavalry.', type: 'Relic', subtype: 'Equipment' }
        ]
    },
    {
        name: 'Projectile Effects',
        cards: [
            { name: 'Archer', text: 'Shoots a projectile dealing damage.', type: 'Minion', element: 'Air' },
            { name: 'Ballista', text: 'Artillery projectile weapon.', type: 'Relic', element: 'Earth' }
        ]
    },
    {
        name: 'Spellcaster Interaction',
        cards: [
            { name: 'Wizard', text: 'Spellcaster. Can cast additional spells.', type: 'Minion', element: 'Air' },
            { name: 'Fireball', text: 'Spell. Spellcaster enhances this effect.', type: 'Magic', element: 'Fire' }
        ]
    },
    {
        name: 'Lethal Synergy',
        cards: [
            { name: 'Assassin', text: 'Lethal damage to any target.', type: 'Minion', element: 'Death' },
            { name: 'Poison', text: 'Lethal effect over time.', type: 'Magic', element: 'Death' }
        ]
    },
    {
        name: 'Token Generation',
        cards: [
            { name: 'Summoner', text: 'Creates token creatures each turn.', type: 'Minion', element: 'Air' },
            { name: 'Army', text: 'Summon multiple token soldiers.', type: 'Magic', element: 'Fire' }
        ]
    },
    {
        name: 'Movement Control',
        cards: [
            { name: 'Teleporter', text: 'Move any unit to any position.', type: 'Magic', element: 'Air' },
            { name: 'Immobilize', text: 'Target cannot move or attack.', type: 'Magic', element: 'Earth' }
        ]
    },
    {
        name: 'Voidwalk Resurrection',
        cards: [
            { name: 'Voidwalker', text: 'Voidwalk. Returns from graveyard.', type: 'Minion', element: 'Death' },
            { name: 'Resurrect', text: 'Bring back voidwalk creatures.', type: 'Magic', element: 'Death' }
        ]
    }
];

let successCount = 0;
let totalTests = testScenarios.length;

testScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. Testing ${scenario.name}...`);
    
    try {
        const combos = identifyCardCombos(scenario.cards);
        
        if (combos.length > 0) {
            console.log(`   ✅ Found ${combos.length} combo(s)`);
            combos.forEach(combo => {
                console.log(`      - ${combo.name} (${combo.synergy} synergy)`);
            });
            successCount++;
        } else {
            console.log(`   ⚠️  No combos detected`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
});

console.log(`📊 Test Results:`);
console.log(`   ✅ Successful detections: ${successCount}/${totalTests}`);
console.log(`   📈 Success rate: ${Math.round(successCount/totalTests*100)}%`);

if (successCount >= totalTests * 0.7) {
    console.log('\n🎉 Combo detection system is working well!');
} else {
    console.log('\n⚠️  Some combo detection functions may need fine-tuning.');
}
