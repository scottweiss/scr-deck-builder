#!/usr/bin/env node

const { identifyCardCombos } = require('./dist/core/cards/cardCombos.js');

// Create test cards matching our utility cards
const testCards = [
    {
        name: "Ring of Morrigan",
        baseName: "ring of morrigan", 
        text: "Bearer has \"Whenever this unit casts a spell, they may deal 1 damage to target nearby unit\"",
        mana_cost: 1,
        type: "Artifact",
        elements: []
    },
    {
        name: "Amulet of Niniane",
        baseName: "amulet of niniane",
        text: "Bearer can't be targeted or damaged by magic",
        mana_cost: 1, 
        type: "Artifact",
        elements: []
    },
    {
        name: "Philosopher's Stone",
        baseName: "philosopher's stone",
        text: "The first spell of each element cast by the bearer each turn costs (1) less",
        mana_cost: 1,
        type: "Artifact", 
        elements: []
    },
    {
        name: "Amethyst Core",
        baseName: "amethyst core",
        text: "Provides (A) and (1) to its controller",
        mana_cost: 1,
        type: "Artifact",
        elements: ["Air"]
    },
    {
        name: "Ruby Core", 
        baseName: "ruby core",
        text: "Provides (F) and (1) to its controller",
        mana_cost: 1,
        type: "Artifact",
        elements: ["Fire"]
    }
];

console.log('Testing Enhanced Utility Combo Detection...\n');

const combos = identifyCardCombos(testCards);

console.log(`Found ${combos.length} combos:\n`);

combos.forEach((combo, index) => {
    console.log(`${index + 1}. ${combo.name} (Synergy: ${combo.synergy})`);
    console.log(`   Cards: ${combo.cards.join(', ')}`);
    console.log(`   Description: ${combo.description}\n`);
});

const totalSynergy = combos.reduce((sum, combo) => sum + combo.synergy, 0);
console.log(`Total synergy for utility cards: ${totalSynergy}`);

if (totalSynergy > 200) {
    console.log('✅ SUCCESS: Utility cards now receive significant synergy boosts!');
} else {
    console.log('❌ Issue: Utility cards may still need better recognition');
}

console.log('\nTest completed!');
