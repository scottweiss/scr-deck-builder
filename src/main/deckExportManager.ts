import { Card } from '../types/Card';
import { Deck } from '../types/Deck';
import * as deckExporter from '../core/deck/builder/deckExporter';
import * as deckStats from '../analyses/synergy/deckStats';
import * as synergyCalculator from '../analyses/synergy/synergyCalculator';

export interface ExportOptions {
    exportJson: boolean;
}

/**
 * Calculate the total synergy score for a deck of cards
 */
function calculateTotalSynergy(cards: Card[]): number {
    return cards.reduce((total, card) => {
        return total + (synergyCalculator.calculateSynergy(card, cards) || 0);
    }, 0);
}

/**
 * Handle deck export to JSON if requested
 */
export function exportDeck(
    selectedAvatar: Card,
    selectedSites: Card[],
    selectedSpells: Card[],
    dominantElement: string,
    options: ExportOptions
): void {
    if (options.exportJson) {
        const totalSynergy = calculateTotalSynergy(selectedSpells);
        const playabilityScore = Math.max(60, 100 - (selectedSpells.length > 40 ? (selectedSpells.length - 40) * 2 : 0));
        
        const deck: Deck = {
            avatar: selectedAvatar,
            sites: selectedSites,
            spellbook: selectedSpells,
            metadata: {
                name: `Generated Deck - ${dominantElement}`,
                description: `Auto-generated deck with ${selectedSpells.length} spellbook cards and ${selectedSites.length} sites.`,
                createdAt: new Date(),
                totalSynergy: totalSynergy,
                playabilityScore: playabilityScore
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
