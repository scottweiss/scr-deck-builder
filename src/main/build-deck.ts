import path from 'path';
import { performance } from 'perf_hooks';
import fs from 'fs';

// Import configuration
import config from '../config';

// Import types
import { Card, CardType, Element as ElementEnum } from '../types/Card'; // Added CardType, ElementEnum
import { Deck } from '../types/Deck';

// Import modules based on system mode
const utils = require(config.SYSTEM_MODE.OPTIMIZED ? '../optimization/utils.optimized' : '../utils/utils');
const sorceryCards = require(config.SYSTEM_MODE.OPTIMIZED ? '../optimization/sorceryCards.optimized' : '../data/processed/sorceryCards');
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
        // Sort by preferring non-preconstructed versions, then by higher market price (if available)
        versions.sort((a, b) => {
            // First, prioritize cards that are not from preconstructed decks
            const aIsPrecon = (a.cleanName || "").includes("Preconstructed");
            const bIsPrecon = (b.cleanName || "").includes("Preconstructed");
            if (aIsPrecon !== bIsPrecon) return aIsPrecon ? 1 : -1;

            // Then, prioritize cards with higher market price (if available)
            const aPrice = parseFloat(a.marketPrice || "0");
            const bPrice = parseFloat(b.marketPrice || "0");
            return bPrice - aPrice;
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

    // Output the recommended deck
    console.log("\n=== RECOMMENDED SORCERY: CONTESTED REALM DECK ===\n");

    console.log("AVATAR:");
    if (selectedAvatar) {
        console.log(`- ${selectedAvatar.name || 'Unknown Avatar'}`);
    } else {
        console.log("- No suitable avatar found");
    }

    console.log("\nSITES (Atlas Deck):");
    for (const site of selectedSites) {
        console.log(`- ${site.name || 'Unknown Site'}`);
    }

    console.log("\nSPELLS (Spellbook Deck):");
    // Sort by mana cost for easier reading
    selectedSpells.sort((a, b) => (a.mana_cost || 0) - (a.mana_cost || 0));

    for (const spell of selectedSpells) {
        const rarityLabel = spell.rarity ? `(${spell.rarity})` : '';
        console.log(`- ${spell.name || 'Unknown Spell'} (${spell.mana_cost || 0} mana) ${rarityLabel}`);
    }

    // Count cards by name to verify rarity limits
    const cardCounts: CardCounts = {};
    for (const spell of selectedSpells) {
        const baseName = spell.baseName;
        cardCounts[baseName] = (cardCounts[baseName] || 0) + 1;
    }

    console.log("\nCard Counts (for rarity limit verification):");
    Object.entries(cardCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
            const card = selectedSpells.find(c => c.baseName === name);
            const rarityLabel = card?.rarity || 'Unknown';
            console.log(`- ${name}: ${count}x (${rarityLabel})`);
        });

    // Get expanded deck stats
    const deckStatsData: DeckStatsData = deckStats.getDeckStats(selectedSpells);

    // Expand the deck analysis output
    console.log("\nDETAILED DECK ANALYSIS:");
    console.log(`Recommended element combination: ${bestElementPair[0]} + ${bestElementPair[1] || ''}`);

    console.log("\nMana Curve:");
    const sortedCosts = Object.keys(deckStatsData.mana_curve).sort((a, b) => parseInt(a) - parseInt(b));
    for (const cost of sortedCosts) {
        const count = deckStatsData.mana_curve[cost];
        const percentage = (count / selectedSpells.length) * 100;
        const bar = '#'.repeat(Math.floor(percentage / 2));
        console.log(`${cost} mana (${count} cards, ${percentage.toFixed(1)}%): ${bar}`);
    }

    console.log("\nElement Distribution:");
    const elementEntries = Object.entries(deckStatsData.elements).sort((a, b) => b[1] - a[1]);
    const totalElements = elementEntries.reduce((sum, [_, count]) => sum + count, 0);
    for (const [element, count] of elementEntries) {
        const percentage = totalElements > 0 ? (count / totalElements) * 100 : 0;
        console.log(`${element}: ${count} cards (${percentage.toFixed(1)}%)`);
    }

    console.log("\nRarity Distribution:");
    const rarityEntries = Object.entries(deckStatsData.rarities).sort((a, b) => b[1] - a[1]);
    for (const [rarity, count] of rarityEntries) {
        const percentage = (count / selectedSpells.length) * 100;
        console.log(`${rarity}: ${count} cards (${percentage.toFixed(1)}%)`);
    }

    // Display strategy information about the deck
    displayDeckStrategy(selectedSpells, deckStatsData);

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

function displayDeckStrategy(selectedSpells: Card[], deckStatsData: DeckStatsData): void {
    console.log("\nStrategy Guide:");
    // Identify deck archetype based on card composition
    const minionCount = selectedSpells.filter(card => card.type && card.type.includes("Minion")).length;
    const magicCount = selectedSpells.filter(card => card.type && card.type.includes("Magic")).length;
    const artifactCount = selectedSpells.filter(card => card.type && card.type.includes("Artifact")).length;

    let archetype: string;
    let strategy: string;

    if (minionCount > selectedSpells.length * 0.6) {
        archetype = "Minion-Heavy";
        strategy = "Focus on controlling the board with your numerous minions. Use your sites to establish territorial advantage.";
    } else if (magicCount > selectedSpells.length * 0.4) {
        archetype = "Spell-Heavy Control";
        strategy = "Control the game with powerful spells. Use your minions as defensive tools while you set up game-winning combos.";
    } else if (artifactCount > selectedSpells.length * 0.3) {
        archetype = "Artifact Combo";
        strategy = "Build up a powerful artifact engine to overwhelm your opponent with value.";
    } else {
        archetype = "Balanced";
        strategy = "Maintain flexibility by balancing minions, artifacts, and spells. Adapt your strategy based on your opponent's deck.";
    }

    console.log(`Deck Archetype: ${archetype}`);
    console.log(`Strategy: ${strategy}`);

    console.log("\nKey Synergies:");
    // Identify powerful card combinations
    const keywordEntries = Object.entries(deckStatsData.keywords).sort((a, b) => b[1] - a[1]);
    for (const [keyword, count] of keywordEntries.slice(0, 3)) {
        console.log(`- ${keyword} synergy: ${count} cards with this keyword`);
    }

    console.log("\nRecommended Mulligan Strategy:");
    console.log("Look for these cards in your opening hand:");
    // Suggest early game cards
    const earlyGameCards = selectedSpells.filter(card => (card.mana_cost || 0) <= 2)
        .sort((a, b) => synergyCalculator.calculateSynergy(b, selectedSpells) - synergyCalculator.calculateSynergy(a, selectedSpells))
        .slice(0, 3);

    for (const card of earlyGameCards) {
        console.log(`- ${card.name || 'Unknown Card'} (${card.mana_cost || 0} mana)`);
    }

    console.log("\nWin Conditions:");
    // Identify potential win conditions
    const highPowerMinions = selectedSpells.filter(card => (card.power || 0) >= 5)
        .sort((a, b) => (b.power || 0) - (a.power || 0))
        .slice(0, 3);

    if (highPowerMinions.length > 0) {
        console.log("High-power minions:");
        for (const card of highPowerMinions) {
            console.log(`- ${card.name || 'Unknown Card'} (Power: ${card.power || 0})`);
        }
    }

    console.log("\nThis deck was optimized for maximum synergy and balanced mana curve using AI analysis.");
    console.log("Note: Foil cards were excluded from consideration.");
    console.log("Rarity limits enforced: 4× ordinary, 3× exceptional, 2× elite, 1× unique");

    console.log("\nHighest Value Cards in Deck:");
    const highValueCards = utils.getHighValueCards(selectedSpells, 10);
    if (highValueCards.length > 0) {
        for (const card of highValueCards) {
            const price = parseFloat(card.marketPrice || "0").toFixed(2);
            console.log(`- ${card.name || 'Unknown Card'} (${card.mana_cost || 0} mana) - $${price}`);
        }
    } else {
        console.log("No cards with market price data found.");
    }

    // DISPLAY OFFICIAL RULES SUMMARY FOR REFERENCE
    if (options.showRules) {
        const rulesSummary = RuleEnforcer.generateRulesSummary();
        console.log("\n📖 OFFICIAL SORCERY: CONTESTED REALM RULES SUMMARY:");
        
        console.log("\nDeck Construction:");
        rulesSummary.deckConstruction.forEach((rule: string) => console.log(`  • ${rule}`));
        
        console.log("\nRarity Limits:");
        rulesSummary.rarityLimits.forEach((rule: string) => console.log(`  • ${rule}`));
        
        console.log("\nElemental Rules:");
        rulesSummary.elementalRules.forEach((rule: string) => console.log(`  • ${rule}`));
        
        console.log("\nSpellcaster Rules:");
        rulesSummary.spellcasterRules.forEach((rule: string) => console.log(`  • ${rule}`));
        
        console.log("\nRegional Strategy:");
        rulesSummary.regionalStrategy.forEach((rule: string) => console.log(`  • ${rule}`));
    }
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
