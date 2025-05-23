import path from 'path';
import { performance } from 'perf_hooks';
import fs from 'fs';

// Import configuration
import config from '../config';

// Import types
import { Card, CardType, Element as ElementEnum } from '../types/Card'; // Added CardType, ElementEnum
import { Deck } from '../types/Deck';

// Import modules
const utils = require('../utils/utils');
const sorceryCards = require('../data/processed/sorceryCards');
const cardAnalysis = require('../core/cards/cardAnalysis');
const synergyCalculator = require('../analyses/synergy/synergyCalculator');
const deckOptimizer = require('../core/deck/deckOptimizer');
const deckStats = require('../analyses/synergy/deckStats');
const siteSelector = require('../analyses/position/siteSelector');
const deckBuilder = require('../core/deck/deckBuilder');
const deckExporter = require('../core/deck/deckExporter');
const { DeckValidator } = require('../core/deck/deckValidator');
const RuleEnforcer = require('../core/rules/ruleEnforcer').default;

interface BuildOptions {
    dataSets: string[];
    preferredElement: string | null;
    preferredArchetype: string | null;
    exportJson: boolean;
    showRules: boolean;
}

interface CardCounts {
    [cardName: string]: number;
}

interface DeckStatsData {
    mana_curve: { [cost: string]: number };
    elements: { [element: string]: number };
    rarities: { [rarity: string]: number };
    keywords: { [keyword: string]: number };
}

// Parse command line arguments
const args: string[] = process.argv.slice(2);
const options: BuildOptions = {
    dataSets: ['Beta', 'ArthurianLegends'],
    preferredElement: null,
    preferredArchetype: null,
    exportJson: false,
    showRules: false
};

// Process command line arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--element' && i + 1 < args.length) {
        options.preferredElement = args[i+1];
        i++;
    } else if (args[i] === '--archetype' && i + 1 < args.length) {
        options.preferredArchetype = args[i+1];
        i++;
    } else if (args[i] === '--set' && i + 1 < args.length) {
        // Allow filtering to specific card set
        options.dataSets = [args[i+1]];
        i++;
    } else if (args[i] === '--export-json') {
        options.exportJson = true;
    } else if (args[i] === '--show-rules') {
        options.showRules = true;
    } else if (args[i] === '--help') {
        console.log(`
Sorcery: Contested Realm Deck Builder
Usage: node build-deck.js [options]

Options:
  --element <element>       Preferred element (Water, Fire, Earth, Air, Void)
  --archetype <archetype>   Preferred deck archetype (Aggro, Control, Midrange, Combo, Balanced, Minion-Heavy, Artifact-Combo, Spell-Heavy)
  --set <setName>           Use specific card set (Beta, ArthurianLegends)
  --export-json             Export deck to JSON file
  --show-rules              Display official rules summary
  --help                    Show this help message
        `);
        process.exit(0);
    }
}

// Main function to build the deck
async function buildDeckInternal(): Promise<void> {
    console.log("Loading card data...");
    const startTime = performance.now();

    // Get pre-processed card data from consolidated source
    const allCards: Card[] = await utils.readCardData(options.dataSets); // Added await

    if (allCards.length === 0) {
        console.log("No cards were loaded. Please check the card data.");
        return;
    }

    // Cards already have processed attributes from the consolidated data source
    console.log("Processing card data...");

    // Group cards by their base name (to handle different versions of the same card)
    const cardsByName: { [name: string]: Card[] } = {};
    for (const card of allCards) { // allCards are RawCard[] effectively
        // Ensure baseName is derived if not present (it should be on Card, not RawCard)
        const baseName = card.baseName || utils.getBaseCardName(card.name);
        if (!cardsByName[baseName]) {
            cardsByName[baseName] = [];
        }
        cardsByName[baseName].push(card);
    }

    // For each group, keep the most desirable version of each card
    const uniqueCards: Card[] = []; // Holds RawCard instances, but typed as Card[]
    for (const [name, versions] of Object.entries(cardsByName)) {
        // Sort by preferring non-preconstructed versions (pricing logic removed)
        versions.sort((a, b) => {
            // Prioritize cards that are not from preconstructed decks
            const aIsPrecon = (a.cleanName || "").includes("Preconstructed");
            const bIsPrecon = (b.cleanName || "").includes("Preconstructed");
            if (aIsPrecon !== bIsPrecon) return aIsPrecon ? 1 : -1;

            // For cards with same precon status, maintain original order
            return 0;
        });

        // Add the best version to our unique cards list, transformed to Card
        uniqueCards.push(utils.transformRawCardToCard(versions[0]));
    }

    // Analyze card pool
    const avatars: Card[] = [];
    const sites: Card[] = [];
    const minions: Card[] = [];
    const artifacts: Card[] = [];
    const auras: Card[] = [];
    const magics: Card[] = [];

    // Sort cards by type
    for (const card of uniqueCards) { // card is now a properly transformed Card
        const cardTypeEnum = card.type; // Use the type property directly

        if (cardTypeEnum === CardType.Avatar) {
            avatars.push(card);
        } else if (cardTypeEnum === CardType.Site) {
            sites.push(card);
        } else if (cardTypeEnum === CardType.Minion) {
            minions.push(card);
        } else if (cardTypeEnum === CardType.Artifact) {
            artifacts.push(card);
        } else if (cardTypeEnum === CardType.Aura) {
            auras.push(card);
        } else if (cardTypeEnum === CardType.Magic) {
            magics.push(card);
        }
    }

    // Count keywords to identify synergies
    const keywords: string[] = [];
    for (const card of uniqueCards) {
        const text = card.text; // Use the text property directly
        if (text) {
            const foundKeywords = utils.extractKeywords(text);
            keywords.push(...foundKeywords);
        }
    }

    const keywordCounter = utils.countOccurrences(keywords);

    // Count elements to identify strongest element
    const elements: string[] = []; // This will store string representations of elements
    for (const card of uniqueCards) { // card is now a transformed Card
        const cardElements = card.elements; // Use the elements property directly
        if (cardElements && cardElements.length > 0) {
            cardElements.forEach((element: ElementEnum) => elements.push(element.toString()));
        }
    }

    const elementCounter = utils.countOccurrences(elements);

    // Use preferred element from command line or use most common
    let dominantElement: string;
    if (options.preferredElement) {
        dominantElement = options.preferredElement.charAt(0).toUpperCase() + 
                         options.preferredElement.slice(1).toLowerCase();
        console.log(`Using preferred element: ${dominantElement}`);
    } else if (Object.keys(elementCounter).length === 0) {
        dominantElement = "Water";  // Default element
    } else {
        dominantElement = utils.getMostCommon(elementCounter, 1)[0][0];
    }

    // Select Avatar based on keyword synergy
    let selectedAvatar: Card | undefined = undefined; // Typed as Card, will hold transformed Card
    for (const avatar of avatars) { // avatars are now transformed Card[]
        const avatarElements = avatar.elements; // Use elements property directly
        if (avatarElements.some((element: ElementEnum) => element.toString().toLowerCase() === dominantElement.toLowerCase())) {
            selectedAvatar = avatar;
            break;
        }
    }

    if (!selectedAvatar && avatars.length > 0) {
        selectedAvatar = avatars[0];  // Default to first avatar if no match
    } else if (!selectedAvatar) {
        console.log("Warning: No avatars found in the card pool.");
    }

    if (selectedAvatar) {
        console.log(`Selected Avatar: ${selectedAvatar.name}`);

        // Check for and report any avatar-restricted cards in the pool
        const restrictedCards = uniqueCards.filter(card => !cardAnalysis.canIncludeWithAvatar(card, selectedAvatar));
        if (restrictedCards.length > 0) {
            console.log(`Note: The following cards cannot be used with ${selectedAvatar.name} and will be excluded:`);
            restrictedCards.forEach(card => console.log(`- ${card.name || "Unknown Card"}`));
        }
    }

    // Choose sites using the site selector module
    const selectedSites: Card[] = siteSelector.selectSites(sites, dominantElement, 30);

    // Build the spellbook deck using the deck builder module
    const { spells: selectedSpells, copiesInDeck }: { spells: Card[], copiesInDeck: CardCounts } = deckBuilder.buildSpellbook({
        minions,
        artifacts,
        auras,
        magics,
        uniqueCards,
        avatar: selectedAvatar,
        preferredArchetype: options.preferredArchetype
    });

    // Log statistics about card copies
    const cardDistribution = Object.entries(copiesInDeck)
        .filter(([_, count]) => count > 1)
        .sort((a, b) => b[1] - a[1]);

    if (cardDistribution.length > 0) {
        console.log("\nCards with multiple copies:");
        cardDistribution.forEach(([name, count]) => {
            console.log(`- ${name}: ${count}x`);
        });
    }

    // Get most synergistic element pairing
    const elementSynergies = deckStats.analyzeElementalSynergy(uniqueCards);

    // VALIDATE DECK ACCORDING TO OFFICIAL RULES
    console.log("\n=== DECK VALIDATION ===");
    const validationResult = DeckValidator.validateDeck(selectedAvatar, selectedSites, selectedSpells);
    
    if (validationResult.errors.length > 0) {
        console.log("❌ DECK VALIDATION ERRORS:");
        validationResult.errors.forEach((error: string) => console.log(`  • ${error}`));
    }
    
    if (validationResult.warnings.length > 0) {
        console.log("⚠️  DECK VALIDATION WARNINGS:");
        validationResult.warnings.forEach((warning: string) => console.log(`  • ${warning}`));
    }
    
    if (validationResult.isValid) {
        console.log("✅ Deck passes all official rule validations!");
    } else {
        console.log("❌ Deck has rule violations that must be fixed before play.");
    }
    
    // GENERATE IMPROVEMENT SUGGESTIONS
    const suggestions = RuleEnforcer.generateImprovementSuggestions(selectedAvatar, selectedSites, selectedSpells, validationResult);
    const advancedWarnings = RuleEnforcer.checkAdvancedRules(selectedAvatar, selectedSites, selectedSpells);
    
    if (suggestions.length > 0 || advancedWarnings.length > 0) {
        console.log("\n💡 DECK IMPROVEMENT SUGGESTIONS:");
        
        suggestions.forEach((suggestion: any) => {
            const priorityIcon = suggestion.priority === 'High' ? '🔴' : 
                               suggestion.priority === 'Medium' ? '🟡' : '🟢';
            console.log(`${priorityIcon} ${suggestion.issue}: ${suggestion.suggestion}`);
            console.log(`   📚 Rule: ${suggestion.ruleRef}`);
        });
        
        advancedWarnings.forEach((warning: string) => {
            console.log(`🟡 Advanced: ${warning}`);
        });
    }
    
    console.log("========================\n");
    let bestElementPair: [string, string];
    if (elementSynergies.length > 0) {
        bestElementPair = elementSynergies[0][0];
    } else {
        bestElementPair = [dominantElement, ""];
    }

    // Generate minimal deck report
    generateMinimalDeckReport(selectedAvatar, selectedSites, selectedSpells, dominantElement, bestElementPair);

    // Export deck to JSON if requested
    if (options.exportJson) {
        const deck: Deck = {
            avatar: selectedAvatar,
            sites: selectedSites,
            spellbook: selectedSpells, // Changed from spells to spellbook
            metadata: { // Added metadata property
                name: `Generated Deck - ${dominantElement}`,
                description: `Auto-generated deck with ${selectedSpells.length} spellbook cards and ${selectedSites.length} sites.`,
                createdAt: new Date(),
                totalSynergy: deckStats.getDeckStats(selectedSpells).synergyScore, // Assuming getDeckStats returns this
                playabilityScore: deckStats.getDeckStats(selectedSpells).playabilityScore // Assuming getDeckStats returns this
            }
        };
        deckExporter.exportToJson(deck);
    }

    const endTime = performance.now();
    console.log(`\nDeck building completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
}



/**
 * Build a Sorcery: Contested Realm deck with specified parameters
 * @param setName The card set name (e.g., 'Beta', 'ArthurianLegends')
 * @param element The preferred element (e.g., 'Water', 'Fire', 'Earth', 'Air', 'Void')
 * @param archetype The preferred archetype (e.g., 'Aggro', 'Control', 'Combo', 'Balanced')
 * @param exportJson Whether to export the deck to JSON
 * @param showRules Whether to display the official rules summary
 * @returns Promise that resolves when the deck is built
 */
export function buildDeck(
    setName?: string, 
    element?: string, 
    archetype?: string,
    exportJson?: boolean,
    showRules?: boolean
): Promise<void> {
    // Update options with provided parameters
    if (setName) {
        options.dataSets = [setName];
    }
    if (element) {
        options.preferredElement = element;
    }
    if (archetype) {
        options.preferredArchetype = archetype;
    }
    if (exportJson !== undefined) {
        options.exportJson = exportJson;
    }
    if (showRules !== undefined) {
        options.showRules = showRules;
    }

    // Run the deck builder with updated options
    return buildDeckInternal().catch((error: Error) => {
        console.error("An error occurred while building the deck:", error);
    });
}

// Run the deck builder if this module is run directly
if (require.main === module) {
    buildDeckInternal().catch((error: Error) => {
        console.error("An error occurred while building the deck:", error);
    });
}

function generateMinimalDeckReport(
    selectedAvatar: Card | undefined, 
    selectedSites: Card[], 
    selectedSpells: Card[], 
    dominantElement: string, 
    bestElementPair: [string, string]
): void {
    console.log("\n=== SORCERY: CONTESTED REALM DECK SUMMARY ===\n");

    // Avatar
    if (selectedAvatar) {
        console.log(`🧙 Avatar: ${selectedAvatar.name || 'Unknown Avatar'}`);
    }

    // Deck composition
    console.log(`📚 Spellbook: ${selectedSpells.length} cards`);
    console.log(`🗺️  Sites: ${selectedSites.length} cards`);
    console.log(`⚡ Primary Element: ${dominantElement}`);
    if (bestElementPair[1]) {
        console.log(`🔗 Element Combo: ${bestElementPair[0]} + ${bestElementPair[1]}`);
    }

    // Get deck stats
    const deckStatsData: DeckStatsData = deckStats.getDeckStats(selectedSpells);

    // Mana curve
    console.log("\n📊 Mana Curve:");
    const sortedCosts = Object.keys(deckStatsData.mana_curve).sort((a, b) => parseInt(a) - parseInt(b));
    for (const cost of sortedCosts) {
        const count = deckStatsData.mana_curve[cost];
        const percentage = (count / selectedSpells.length) * 100;
        const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(Math.max(0, 4 - Math.floor(percentage / 5)));
        console.log(`  ${cost} mana: ${count.toString().padStart(2)} cards (${percentage.toFixed(0).padStart(2)}%) ${bar}`);
    }

    // Deck archetype and strategy
    const minionCount = selectedSpells.filter(card => card.type && card.type.toString().includes("Minion")).length;
    const magicCount = selectedSpells.filter(card => card.type && card.type.toString().includes("Magic")).length;
    const artifactCount = selectedSpells.filter(card => card.type && card.type.toString().includes("Artifact")).length;

    let archetype: string;
    let strategy: string;

    if (minionCount > selectedSpells.length * 0.6) {
        archetype = "Minion-Heavy";
        strategy = "Control the board with numerous minions and establish territorial advantage.";
    } else if (magicCount > selectedSpells.length * 0.4) {
        archetype = "Spell-Heavy Control";
        strategy = "Control with powerful spells while setting up game-winning combos.";
    } else if (artifactCount > selectedSpells.length * 0.3) {
        archetype = "Artifact Combo";
        strategy = "Build a powerful artifact engine to overwhelm with value.";
    } else {
        archetype = "Balanced";
        strategy = "Maintain flexibility and adapt based on opponent's strategy.";
    }

    console.log(`\n🎯 Archetype: ${archetype}`);
    console.log(`📋 Strategy: ${strategy}`);

    // Key synergies
    const keywordEntries = Object.entries(deckStatsData.keywords).sort((a, b) => b[1] - a[1]);
    if (keywordEntries.length > 0) {
        console.log("\n🔄 Key Synergies:");
        keywordEntries.slice(0, 3).forEach(([keyword, count]) => {
            console.log(`  • ${keyword}: ${count} cards`);
        });
    }

    // Early game recommendations
    const earlyGameCards = selectedSpells.filter(card => (card.mana_cost || 0) <= 2)
        .sort((a, b) => synergyCalculator.calculateSynergy(b, selectedSpells) - synergyCalculator.calculateSynergy(a, selectedSpells))
        .slice(0, 3);

    if (earlyGameCards.length > 0) {
        console.log("\n🎲 Mulligan Targets (early game):");
        earlyGameCards.forEach(card => {
            console.log(`  • ${card.name || 'Unknown Card'} (${card.mana_cost || 0} mana)`);
        });
    }

    // Win conditions
    const highPowerMinions = selectedSpells.filter(card => (card.power || 0) >= 5)
        .sort((a, b) => (b.power || 0) - (a.power || 0))
        .slice(0, 3);

    if (highPowerMinions.length > 0) {
        console.log("\n🏆 Win Conditions:");
        highPowerMinions.forEach(card => {
            console.log(`  • ${card.name || 'Unknown Card'} (${card.power || 0} power)`);
        });
    }

    // Rarity distribution (compact)
    const rarityEntries = Object.entries(deckStatsData.rarities).sort((a, b) => b[1] - a[1]);
    const rarityString = rarityEntries.map(([rarity, count]) => `${count} ${rarity}`).join(', ');
    console.log(`\n💎 Rarity: ${rarityString}`);

    console.log("\n" + "=".repeat(50));
}
