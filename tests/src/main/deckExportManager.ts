
import { Card, Deck} from '../../../src/types';


const deckExporter = require('../core/deck/builder/deckExporter');
const deckStats = require('../analyses/synergy/deckStats');

export interface ExportOptions {
    exportJson: boolean;
}

/**
 * Handle deck export to JSON if requested
 */
export function exportDeck(
    selectedAvatar: Card | undefined,
    selectedSites: Card[],
    selectedSpells: Card[],
    dominantElement: string,
    options: ExportOptions
): void {
    if (options.exportJson) {
        const deck: Deck = {
            avatar: selectedAvatar,
            sites: selectedSites,
            spellbook: selectedSpells,
            metadata: {
                name: `Generated Deck - ${dominantElement}`,
                description: `Auto-generated deck with ${selectedSpells.length} spellbook cards and ${selectedSites.length} sites.`,
                createdAt: new Date(),
                totalSynergy: deckStats.getDeckStats(selectedSpells).synergyScore,
                playabilityScore: deckStats.getDeckStats(selectedSpells).playabilityScore
            }
        };
        deckExporter.exportToJson(deck);
    }
}

/**
 * Log complete deck list information
 */
export function logCardDistribution(copiesInDeck: Record<string, number>): void {
    const allCards = Object.entries(copiesInDeck)
        .sort((a, b) => {
            // Sort by count descending, then alphabetically
            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }
            return a[0].localeCompare(b[0]);
        });

    if (allCards.length > 0) {
        console.log("\nDeck List:");
        allCards.forEach(([name, count]) => {
            if (count === 1) {
                console.log(`- ${name}`);
            } else {
                console.log(`- ${name} ${count}x`);
            }
        });
    }
}
