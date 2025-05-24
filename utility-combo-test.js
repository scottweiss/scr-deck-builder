#!/usr/bin/env node

try {
    const { identifyCardCombos } = require('./dist/core/cards/cardCombos.js');
    console.log("Loaded combo detection function successfully");

    // Create test cards matching our utility cards
    const testCards = [
        {
            name: "Ring of Morrigan",
            baseName: "ring of morrigan", 
            text: "Bearer has \"Whenever this unit casts a spell, they may deal 1 damage to target nearby unit to have you gain 1 life.\"",
            mana_cost: 1,
            type: "Artifact",
            elements: []
        },
        {
            name: "Amulet of Niniane",
            baseName: "amulet of niniane",
            text: "Bearer can't be targeted or damaged by magic.",
            mana_cost: 1, 
            type: "Artifact",
            elements: []
        },
        {
            name: "Philosopher's Stone",
            baseName: "philosopher's stone",
            text: "The first spell of each element cast by the bearer each turn costs (1) less.",
            mana_cost: 1,
            type: "Artifact", 
            elements: []
        },
        {
            name: "Amethyst Core",
            baseName: "amethyst core",
            text: "Provides (A) and (1) to its controller.",
            mana_cost: 1,
            type: "Artifact",
            elements: []
        },
        {
            name: "Onyx Core",
            baseName: "onyx core", 
            text: "Provides (E) and (1) to its controller.",
            mana_cost: 1,
            type: "Artifact",
            elements: []
        },
        {
            name: "Ruby Core",
            baseName: "ruby core",
            text: "Provides (F) and (1) to its controller.",
            mana_cost: 1,
            type: "Artifact",
            elements: []
        },
        {
            name: "Aquamarine Core",
            baseName: "aquamarine core",
            text: "Provides (W) and (1) to its controller.",
            mana_cost: 1,
            type: "Artifact",
            elements: []
        }
    ];

    console.log("Testing utility combo detection...");
    console.log("Input cards:", testCards.map(c => c.name));

    const combos = identifyCardCombos(testCards);
    console.log(`Found ${combos.length} combos`);
    
    if (combos.length > 0) {
        combos.forEach((combo, i) => {
            console.log(`${i + 1}. ${combo.name} (synergy: ${combo.synergy})`);
            console.log(`   Cards: ${combo.cards.join(', ')}`);
            console.log(`   Description: ${combo.description}`);
        });
    }

} catch (error) {
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
}
