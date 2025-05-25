import { Card } from '../../../types/Card';

import { ManaCostDistribution, calculateCurrentCurve } from './manaCurveAnalyzer';

/**
 * Interface for deck analysis results
 */
export interface DeckAnalysisResults {
    isPlayable: boolean;
    warnings: string[];
    recommendations: string[];
    stats: DeckStats;
}

/**
 * Interface for deck statistics
 */
export interface DeckStats {
    totalCards: number;
    earlyGameCards: number;
    midGameCards: number;
    lateGameCards: number;
    cardAdvantageCount: number;
    manaAcceleration: number;
    manaCurve: ManaCostDistribution;
}

/**
 * Analyze deck composition and playability
 * @param deck Deck to analyze
 * @returns Analysis results with warnings and recommendations
 */
export function analyzeDeckComposition(deck: Card[]): DeckAnalysisResults {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Calculate mana curve
    const manaCurve = calculateCurrentCurve(deck);
    
    // Check early game playability
    const earlyGameCards = (manaCurve[0] || 0) + (manaCurve[1] || 0) + (manaCurve[2] || 0);
    if (earlyGameCards < 12) {
        warnings.push(`Only ${earlyGameCards} early game cards (0-2 mana). Consider adding more low-cost cards.`);
        recommendations.push("Add more 1-2 mana cost cards for better early game presence");
    }
    
    // Check mid game playability
    const midGameCards = (manaCurve[3] || 0) + (manaCurve[4] || 0);
    if (midGameCards < 10) {
        warnings.push(`Only ${midGameCards} mid-game cards (3-4 mana). This could create a weak mid-game.`);
        recommendations.push("Add more 3-4 mana cost cards for stronger mid-game");
    }
    
    // Check late game presence
    const lateGameCards = (manaCurve[5] || 0) + (manaCurve[6] || 0) + (manaCurve[7] || 0);
    if (lateGameCards < 6) {
        recommendations.push("Consider adding more late-game threats (5+ mana)");
    } else if (lateGameCards > 15) {
        warnings.push(`${lateGameCards} late-game cards might make the deck too slow`);
        recommendations.push("Consider reducing some high-cost cards for better curve");
    }
    
    // Check card draw/advantage
    const cardAdvantageCount = countCardAdvantageCards(deck);
    if (cardAdvantageCount < 5) {
        warnings.push(`Only ${cardAdvantageCount} cards that provide card advantage. Consider adding more card draw.`);
        recommendations.push("Add cards that draw, search, or cycle for better card advantage");
    }
    
    // Check mana production
    const manaAcceleration = countManaAccelerationCards(deck);
    if (manaAcceleration < 3 && lateGameCards > 8) {
        warnings.push(`Deck has ${manaAcceleration} mana acceleration cards but ${lateGameCards} high-cost cards.`);
        recommendations.push("Add mana acceleration or reduce high-cost cards");
    }
    
    // Check deck size
    if (deck.length < 50) {
        warnings.push(`Deck only has ${deck.length} cards. Should have exactly 50 cards.`);
    } else if (deck.length > 50) {
        warnings.push(`Deck has ${deck.length} cards. Should have exactly 50 cards.`);
    }
    
    const stats: DeckStats = {
        totalCards: deck.length,
        earlyGameCards,
        midGameCards,
        lateGameCards,
        cardAdvantageCount,
        manaAcceleration,
        manaCurve
    };
    
    return {
        isPlayable: warnings.length === 0,
        warnings,
        recommendations,
        stats
    };
}

/**
 * Count cards that provide card advantage
 * @param deck Deck to analyze
 * @returns Number of card advantage cards
 */
export function countCardAdvantageCards(deck: Card[]): number {
    return deck.filter(card => {
        const text = (card.text || "").toLowerCase();
        return text.includes("draw") || text.includes("search") || text.includes("cycle");
    }).length;
}

/**
 * Count cards that provide mana acceleration
 * @param deck Deck to analyze
 * @returns Number of mana acceleration cards
 */
export function countManaAccelerationCards(deck: Card[]): number {
    return deck.filter(card => {
        const text = (card.text || "").toLowerCase();
        return text.includes("add") && text.includes("mana");
    }).length;
}

/**
 * Generate deck analysis report
 * @param deck Deck to analyze
 * @returns Formatted analysis report
 */
export function generateDeckAnalysisReport(deck: Card[]): string {
    const analysis = analyzeDeckComposition(deck);
    const { stats, warnings, recommendations } = analysis;
    
    let report = "\n=== DECK ANALYSIS REPORT ===\n\n";
    
    // Basic stats
    report += `Total Cards: ${stats.totalCards}/50\n`;
    report += `Mana Curve Distribution:\n`;
    for (let i = 0; i <= 7; i++) {
        const count = stats.manaCurve[i] || 0;
        const percentage = stats.totalCards > 0 ? (count / stats.totalCards * 100).toFixed(1) : "0.0";
        report += `  ${i}${i === 7 ? '+' : ''} mana: ${count} cards (${percentage}%)\n`;
    }
    
    report += `\nPlayability Analysis:\n`;
    report += `  Early Game (0-2): ${stats.earlyGameCards} cards\n`;
    report += `  Mid Game (3-4): ${stats.midGameCards} cards\n`;
    report += `  Late Game (5+): ${stats.lateGameCards} cards\n`;
    
    report += `\nUtility Analysis:\n`;
    report += `  Card Advantage: ${stats.cardAdvantageCount} cards\n`;
    report += `  Mana Acceleration: ${stats.manaAcceleration} cards\n`;
    
    // Warnings
    if (warnings.length > 0) {
        report += `\n⚠️  WARNINGS:\n`;
        warnings.forEach(warning => {
            report += `  • ${warning}\n`;
        });
    }
    
    // Recommendations
    if (recommendations.length > 0) {
        report += `\n💡 RECOMMENDATIONS:\n`;
        recommendations.forEach(rec => {
            report += `  • ${rec}\n`;
        });
    }
    
    // Overall assessment
    if (analysis.isPlayable) {
        report += `\n✅ OVERALL: Deck composition looks good!\n`;
    } else {
        report += `\n⚠️  OVERALL: Deck has some issues that should be addressed.\n`;
    }
    
    return report;
}

/**
 * Log deck playability analysis to console
 * @param deck Deck to analyze
 */
export function logDeckPlayabilityAnalysis(deck: Card[]): void {
    const analysis = analyzeDeckComposition(deck);
    const { stats, warnings } = analysis;
    
    console.log("\nFinal deck playability analysis:");
    
    // Check early game playability
    if (stats.earlyGameCards < 12) {
        console.log(`⚠️ WARNING: Only ${stats.earlyGameCards} early game cards (0-2 mana). Consider adding more low-cost cards.`);
    } else {
        console.log(`✓ Good early game presence: ${stats.earlyGameCards} cards costing 0-2 mana`);
    }
    
    // Check mid game playability
    if (stats.midGameCards < 10) {
        console.log(`⚠️ WARNING: Only ${stats.midGameCards} mid-game cards (3-4 mana). This could create a weak mid-game.`);
    } else {
        console.log(`✓ Good mid-game presence: ${stats.midGameCards} cards costing 3-4 mana`);
    }
    
    // Check card draw/advantage
    if (stats.cardAdvantageCount < 5) {
        console.log(`⚠️ WARNING: Only ${stats.cardAdvantageCount} cards that provide card advantage. Consider adding more card draw.`);
    } else {
        console.log(`✓ Good card advantage: ${stats.cardAdvantageCount} cards that draw, search, or cycle`);
    }
    
    // Check mana production
    if (stats.manaAcceleration < 3 && stats.lateGameCards > 8) {
        console.log(`⚠️ WARNING: Deck has ${stats.manaAcceleration} mana acceleration cards but ${stats.lateGameCards} high-cost cards.`);
    } else if (stats.manaAcceleration >= 3) {
        console.log(`✓ Good mana production: ${stats.manaAcceleration} cards that generate additional mana`);
    }
}
