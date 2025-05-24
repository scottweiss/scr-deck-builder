console.log('Starting simple test...');

try {
    const { calculateSynergy } = require('./dist/analyses/synergy/synergyCalculator');
    console.log('✓ Successfully imported calculateSynergy');
    
    const { loadCards } = require('./dist/data/processed/cardLoader');
    console.log('✓ Successfully imported loadCards');
    
    // Test with simple mock data first
    const mockCard = {
        name: "Ring of Morrigan",
        baseName: "ring of morrigan",
        text: "Bearer has spell trigger ability",
        mana_cost: 1,
        type: "Artifact",
        elements: []
    };
    
    const mockDeck = [
        {
            name: "Amethyst Core",
            baseName: "amethyst core",
            text: "Provides (A) and (1) to its controller",
            mana_cost: 1,
            type: "Artifact",
            elements: ["Air"]
        }
    ];
    
    console.log('Testing calculateSynergy with mock data...');
    const synergy = calculateSynergy(mockCard, mockDeck);
    console.log(`Mock synergy score: ${synergy}`);
    
    console.log('Simple test completed successfully!');
    
} catch (error) {
    console.error('Error in test:', error.message);
    console.error('Stack:', error.stack);
}
