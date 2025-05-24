import { Card } from '../types/Card';
import { Deck } from '../types/Deck';

const deckExporter = require('../core/deck/deckExporter');
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
 * Log card distribution information
 */
export function logCardDistribution(copiesInDeck: Record<string, number>): void {
    const cardDistribution = Object.entries(copiesInDeck)
        .filter(([_, count]) => count > 1)
        .sort((a, b) => b[1] - a[1]);

    if (cardDistribution.length > 0) {
        console.log("\nCards with multiple copies:");
        cardDistribution.forEach(([name, count]) => {
            console.log(`- ${name}: ${count}x`);
        });
    }
}
