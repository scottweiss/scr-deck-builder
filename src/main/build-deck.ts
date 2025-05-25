import * as path from 'path';
import { performance } from 'perf_hooks';
import * as fs from 'fs';

import config from '../config';
import { Card, CardType, Element as ElementEnum } from '../types/Card';
import { Deck } from '../types/Deck';
import * as utils from '../utils/utils';
import * as deckStats from '../analyses/synergy/deckStats';
import * as siteSelector from '../analyses/position/siteSelector';
import * as deckBuilder from '../core/deck/builder/deckBuilder';
import * as synergyCalculator from '../analyses/synergy/synergyCalculator';

import { parseCommandLineArgs, BuildOptions } from './commandLineParser';
import { processCardData } from './cardProcessor';
import { selectAvatar } from './avatarSelector';
import { validateDeck } from './deckValidation';
import { generateDeckReport, DeckStatsData } from './deckReporting';
import { exportDeck, logCardDistribution } from './deckExportManager';

// Import remaining modules

interface CardCounts {
    [cardName: string]: number;
}

// Parse command line arguments
const options: BuildOptions = parseCommandLineArgs();

// Main function to build the deck
async function buildDeckInternal(): Promise<void> {
    console.log("Loading card data...");
    const startTime = performance.now();

    try {
        // Process card data using the modular function
        const cardData = await processCardData(options.dataSets);
        const { uniqueCards, avatars, sites, minions, artifacts, auras, magics, keywords, elements } = cardData;

        if (uniqueCards.length === 0) {
            console.log("No cards were loaded. Please check the card data.");
            return;
        }

        // Select avatar using the modular function
        const avatarResult = selectAvatar(avatars, elements, keywords, uniqueCards, options.preferredElement);
        const selectedAvatar = avatarResult.selectedAvatar;
        const dominantElement = avatarResult.dominantElement;

        if (selectedAvatar) {
            console.log(`Selected Avatar: ${selectedAvatar.name}`);
        } else {
            console.log("Warning: No avatars found in the card pool.");
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
            sites: selectedSites, // Pass selected sites to calculate proper elemental affinity
            avatar: selectedAvatar,
            preferredArchetype: options.preferredArchetype
        });

        // Log card distribution using the modular function
        logCardDistribution(copiesInDeck);

        // Validate deck using the modular function
        const validationResult = validateDeck(selectedAvatar, selectedSites, selectedSpells);

        // Get most synergistic element pairing
        const elementSynergies = deckStats.analyzeElementalSynergy(uniqueCards);
        let bestElementPair: [string, string];
        if (elementSynergies.length > 0) {
            bestElementPair = elementSynergies[0][0];
        } else {
            bestElementPair = [dominantElement, ""];
        }

        // Generate deck report using the modular function
        generateDeckReport(selectedAvatar, selectedSites, selectedSpells, dominantElement, bestElementPair);

        // Export deck to JSON if requested using the modular function
        if (options.exportJson) {
            exportDeck(selectedAvatar, selectedSites, selectedSpells, dominantElement, { exportJson: true });
        }

        const endTime = performance.now();
        console.log(`\nDeck building completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds.`);
    } catch (error) {
        console.error("Error during deck building:", error);
        throw error;
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
