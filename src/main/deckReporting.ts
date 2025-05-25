import { Card } from '../types/Card';
import * as deckStats from '../analyses/synergy/deckStats';
import * as synergyCalculator from '../analyses/synergy/synergyCalculator';

export interface DeckStatsData {
    mana_curve: { [cost: string]: number };
    elements: { [element: string]: number };
    rarities: { [rarity: string]: number };
    keywords: { [keyword: string]: number };
}

/**
 * Generate a comprehensive deck report with statistics and recommendations
 */
export function generateDeckReport(
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
    generateManaCurveReport(deckStatsData, selectedSpells);

    // Deck archetype and strategy
    generateArchetypeAnalysis(selectedSpells);

    // Key synergies
    generateSynergyAnalysis(deckStatsData);

    // Early game recommendations
    generateEarlyGameAnalysis(selectedSpells);

    // Win conditions
    generateWinConditionAnalysis(selectedSpells);

    // Rarity distribution
    generateRarityAnalysis(deckStatsData);

    console.log("\n" + "=".repeat(50));
}

/**
 * Generate mana curve analysis
 */
function generateManaCurveReport(deckStatsData: DeckStatsData, selectedSpells: Card[]): void {
    console.log("\n📊 Mana Curve:");
    const sortedCosts = Object.keys(deckStatsData.mana_curve).sort((a, b) => parseInt(a) - parseInt(b));
    for (const cost of sortedCosts) {
        const count = deckStatsData.mana_curve[cost];
        const percentage = (count / selectedSpells.length) * 100;
        const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(Math.max(0, 4 - Math.floor(percentage / 5)));
        console.log(`  ${cost} mana: ${count.toString().padStart(2)} cards (${percentage.toFixed(0).padStart(2)}%) ${bar}`);
    }
}

/**
 * Generate deck archetype analysis
 */
function generateArchetypeAnalysis(selectedSpells: Card[]): void {
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
}

/**
 * Generate synergy analysis
 */
function generateSynergyAnalysis(deckStatsData: DeckStatsData): void {
    const keywordEntries = Object.entries(deckStatsData.keywords).sort((a, b) => b[1] - a[1]);
    if (keywordEntries.length > 0) {
        console.log("\n🔄 Key Synergies:");
        keywordEntries.slice(0, 3).forEach(([keyword, count]) => {
            console.log(`  • ${keyword}: ${count} cards`);
        });
    }
}

/**
 * Generate early game analysis
 */
function generateEarlyGameAnalysis(selectedSpells: Card[]): void {
    const earlyGameCards = selectedSpells.filter(card => (card.mana_cost || 0) <= 2)
        .sort((a, b) => synergyCalculator.calculateSynergy(b, selectedSpells) - synergyCalculator.calculateSynergy(a, selectedSpells))
        .slice(0, 3);

    if (earlyGameCards.length > 0) {
        console.log("\n🎲 Mulligan Targets (early game):");
        earlyGameCards.forEach(card => {
            console.log(`  • ${card.name || 'Unknown Card'} (${card.mana_cost || 0} mana)`);
        });
    }
}

/**
 * Generate win condition analysis
 */
function generateWinConditionAnalysis(selectedSpells: Card[]): void {
    const highPowerMinions = selectedSpells.filter(card => (card.power || 0) >= 5)
        .sort((a, b) => (b.power || 0) - (a.power || 0))
        .slice(0, 3);

    if (highPowerMinions.length > 0) {
        console.log("\n🏆 Win Conditions:");
        highPowerMinions.forEach(card => {
            console.log(`  • ${card.name || 'Unknown Card'} (${card.power || 0} power)`);
        });
    }
}

/**
 * Generate rarity analysis
 */
function generateRarityAnalysis(deckStatsData: DeckStatsData): void {
    const rarityEntries = Object.entries(deckStatsData.rarities).sort((a, b) => b[1] - a[1]);
    const rarityString = rarityEntries.map(([rarity, count]) => `${count} ${rarity}`).join(', ');
    console.log(`\n💎 Rarity: ${rarityString}`);
}
