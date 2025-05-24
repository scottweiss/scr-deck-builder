// Test deck building process for utility artifacts
const utils = require('./dist/utils/utils');
const deckBuilder = require('./dist/core/deck/deckBuilder');
const synergyCalculator = require('./dist/analyses/synergy/synergyCalculator');

async function testUtilityArtifactSelection() {
    console.log("Testing utility artifact selection in deck building...");
    
    try {
        // Load all cards
        const allCards = await utils.readCardData(['Beta', 'ArthurianLegends']);
        console.log(`Loaded ${allCards.length} total cards`);
        
        // Group cards by type
        const avatars = [];
        const sites = [];
        const minions = [];
        const artifacts = [];
        const auras = [];
        const magics = [];
        
        // Transform and categorize cards
        for (const rawCard of allCards) {
            const card = utils.transformRawCardToCard(rawCard);
            const cardType = card.type.toString();
            
            if (cardType.includes('Avatar')) avatars.push(card);
            else if (cardType.includes('Site')) sites.push(card);
            else if (cardType.includes('Minion')) minions.push(card);
            else if (cardType.includes('Artifact')) artifacts.push(card);
            else if (cardType.includes('Aura')) auras.push(card);
            else if (cardType.includes('Magic')) magics.push(card);
        }
        
        console.log(`Found ${artifacts.length} artifacts in total`);
        
        // Find our target utility artifacts
        const utilityArtifacts = artifacts.filter(card => {
            const baseName = card.baseName?.toLowerCase() || '';
            return baseName.includes('ring of morrigan') || 
                   baseName.includes('amulet of niniane') || 
                   baseName.includes('philosopher\'s stone') ||
                   baseName.includes('amethyst core') ||
                   baseName.includes('onyx core') ||
                   baseName.includes('ruby core') ||
                   baseName.includes('aquamarine core');
        });
        
        console.log(`Found ${utilityArtifacts.length} utility artifacts:`);
        utilityArtifacts.forEach(card => {
            console.log(`- ${card.name} (${card.baseName})`);
        });
        
        // Test synergy calculation for these artifacts
        console.log("\nTesting synergy scores for utility artifacts...");
        
        // Create a basic deck to test synergy against
        const testDeck = [
            ...minions.slice(0, 15),
            ...magics.slice(0, 10),
            ...auras.slice(0, 3)
        ];
        
        console.log(`Testing against deck of ${testDeck.length} cards`);
        
        for (const utilityCard of utilityArtifacts) {
            const synergy = synergyCalculator.calculateSynergy(utilityCard, testDeck);
            console.log(`${utilityCard.baseName}: synergy = ${synergy.toFixed(2)}`);
        }
        
        // Test the actual deck building process with logging
        console.log("\nTesting actual deck building with artifacts...");
        
        const avatar = avatars[0]; // Use first available avatar
        console.log(`Using avatar: ${avatar?.name}`);
        
        // Build deck and capture artifacts selected
        const originalConsoleLog = console.log;
        const logs = [];
        console.log = (...args) => {
            logs.push(args.join(' '));
            originalConsoleLog(...args);
        };
        
        const result = deckBuilder.buildSpellbook({
            minions,
            artifacts,
            auras,
            magics,
            uniqueCards: allCards.map(utils.transformRawCardToCard),
            avatar,
            preferredArchetype: 'Combo'
        });
        
        console.log = originalConsoleLog;
        
        // Check which artifacts were selected
        const selectedArtifacts = result.spells.filter(card => 
            card.type.toString().includes('Artifact')
        );
        
        console.log(`\nSelected ${selectedArtifacts.length} artifacts in final deck:`);
        selectedArtifacts.forEach(card => {
            const synergy = synergyCalculator.calculateSynergy(card, result.spells);
            console.log(`- ${card.name} (synergy: ${synergy.toFixed(2)})`);
        });
        
        // Check if any utility artifacts made it
        const selectedUtilityArtifacts = selectedArtifacts.filter(card => {
            const baseName = card.baseName?.toLowerCase() || '';
            return baseName.includes('ring of morrigan') || 
                   baseName.includes('amulet of niniane') || 
                   baseName.includes('philosopher\'s stone') ||
                   baseName.includes('amethyst core') ||
                   baseName.includes('onyx core') ||
                   baseName.includes('ruby core') ||
                   baseName.includes('aquamarine core');
        });
        
        console.log(`\nUtility artifacts selected: ${selectedUtilityArtifacts.length}`);
        if (selectedUtilityArtifacts.length > 0) {
            selectedUtilityArtifacts.forEach(card => console.log(`- ${card.name}`));
        } else {
            console.log("❌ NO utility artifacts were selected!");
        }
        
        // Analyze why utility artifacts weren't selected
        console.log("\nAnalyzing selection criteria...");
        
        // Sort all artifacts by synergy to see ranking
        const artifactsSortedBySynergy = artifacts
            .filter(card => !result.spells.some(s => s.baseName === card.baseName))
            .map(card => ({
                card,
                synergy: synergyCalculator.calculateSynergy(card, result.spells)
            }))
            .sort((a, b) => b.synergy - a.synergy);
        
        console.log("Top 10 artifacts by synergy (not in deck):");
        artifactsSortedBySynergy.slice(0, 10).forEach(item => {
            console.log(`- ${item.card.baseName}: ${item.synergy.toFixed(2)}`);
        });
        
        // Check where utility artifacts rank
        console.log("\nUtility artifact rankings:");
        utilityArtifacts.forEach(utilityCard => {
            const ranking = artifactsSortedBySynergy.findIndex(item => 
                item.card.baseName === utilityCard.baseName
            );
            const synergy = synergyCalculator.calculateSynergy(utilityCard, result.spells);
            console.log(`- ${utilityCard.baseName}: rank ${ranking + 1}/${artifactsSortedBySynergy.length}, synergy: ${synergy.toFixed(2)}`);
        });
        
    } catch (error) {
        console.error("Error in utility artifact test:", error);
    }
}

testUtilityArtifactSelection();
