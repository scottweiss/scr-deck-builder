import { Card } from './gameState';
import { BatchResult } from './matchSimulator';

/**
 * Analyze deck composition
 */
export function analyzeDeckComposition(deck: Card[]): DeckComposition {
    const units = deck.filter(c => c.type.toLowerCase() === 'unit' || c.type.toLowerCase() === 'minion');
    const spells = deck.filter(c => c.type.toLowerCase() === 'spell' || c.type.toLowerCase() === 'magic');
    const sites = deck.filter(c => c.type.toLowerCase() === 'site');

    const elements = {
        air: deck.filter(c => c.elements?.includes('Air')).length,
        earth: deck.filter(c => c.elements?.includes('Earth')).length,
        fire: deck.filter(c => c.elements?.includes('Fire')).length,
        water: deck.filter(c => c.elements?.includes('Water')).length
    };

    const manaCurve = Array(10).fill(0);
    deck.forEach(card => {
        const cost = Math.min(9, card.cost || 0);
        manaCurve[cost]++;
    });

    return {
        units: units.length,
        spells: spells.length,
        sites: sites.length,
        elements,
        manaCurve,
        averageCost: deck.reduce((sum, c) => sum + (c.cost || 0), 0) / deck.length
    };
}

/**
 * Identify deck strengths based on composition and results
 */
export function identifyStrengths(deck: Card[], results: BatchResult[]): string[] {
    const strengths: string[] = [];
    
    // Analyze card types
    const units = deck.filter(c => c.type.toLowerCase() === 'unit' || c.type.toLowerCase() === 'minion');
    const spells = deck.filter(c => c.type.toLowerCase() === 'spell' || c.type.toLowerCase() === 'magic');

    if (units.length >= deck.length * 0.4) {
        strengths.push('Strong board presence');
    }
    
    if (spells.length >= deck.length * 0.3) {
        strengths.push('Good spell support');
    }

    // Analyze mana curve
    const avgCost = deck.reduce((sum, c) => sum + (c.cost || 0), 0) / deck.length;
    if (avgCost <= 3) {
        strengths.push('Fast aggressive pressure');
    } else if (avgCost >= 5) {
        strengths.push('Powerful late game');
    }

    // Analyze win rate patterns
    if (results && results.length > 0) {
        const fastWins = results.filter(r => r.averageTurns <= 8).length;
        if (fastWins >= results.length * 0.3) {
            strengths.push('Consistent early game');
        }
    }

    return strengths;
}

/**
 * Identify deck weaknesses based on composition and results
 */
export function identifyWeaknesses(deck: Card[], results: BatchResult[]): string[] {
    const weaknesses: string[] = [];

    // Check for common weaknesses
    if (results && results.length > 0) {
        const lowWinRateResults = results.filter(r => r.player1WinRate < 0.4);
        if (lowWinRateResults.length >= results.length * 0.3) {
            weaknesses.push('Inconsistent performance');
        }

        const longGames = results.filter(r => r.averageTurns >= 15).length;
        if (longGames >= results.length * 0.4) {
            weaknesses.push('Slow to close out games');
        }
    }

    // Analyze deck composition
    const units = deck.filter(c => c.type.toLowerCase() === 'unit' || c.type.toLowerCase() === 'minion');
    if (units.length < deck.length * 0.2) {
        weaknesses.push('Lacks board presence');
    }

    const avgCost = deck.reduce((sum, c) => sum + (c.cost || 0), 0) / deck.length;
    if (avgCost >= 6) {
        weaknesses.push('High mana curve may cause slow starts');
    }

    return weaknesses;
}

/**
 * Generate recommendations for deck improvement
 */
export function generateRecommendations(deck: Card[], results: BatchResult[]): string[] {
    const recommendations: string[] = [];

    if (results && results.length > 0) {
        const avgWinRate = results.reduce((sum, r) => sum + r.player1WinRate, 0) / results.length;
        
        if (avgWinRate < 0.5) {
            recommendations.push('Consider adding more efficient cards');
            recommendations.push('Review mana curve for better consistency');
        }
    }

    const units = deck.filter(c => c.type.toLowerCase() === 'unit' || c.type.toLowerCase() === 'minion');
    const spells = deck.filter(c => c.type.toLowerCase() === 'spell' || c.type.toLowerCase() === 'magic');

    if (units.length < spells.length) {
        recommendations.push('Consider adding more units for board presence');
    }

    const highCostCards = deck.filter(c => (c.cost || 0) >= 6).length;
    if (highCostCards >= deck.length * 0.3) {
        recommendations.push('Consider reducing high-cost cards for better early game');
    }

    return recommendations;
}

/**
 * Analyze match results to determine key factors in a matchup
 */
export function identifyMatchupFactors(result: BatchResult): string[] {
    const factors: string[] = [];

    if (result.averageTurns <= 8) {
        factors.push('Fast-paced matchup');
    } else if (result.averageTurns >= 15) {
        factors.push('Control-oriented matchup');
    }

    if (result.winReasons && result.winReasons.life >= result.totalGames * 0.7) {
        factors.push('Damage race is critical');
    }

    if (result.winReasons && result.winReasons.timeout >= result.totalGames * 0.2) {
        factors.push('Games tend to go long');
    }

    return factors;
}

/**
 * Classify deck performance based on win rate
 */
export function classifyPerformance(winRate: number): 'excellent' | 'good' | 'average' | 'poor' {
    if (winRate >= 0.65) return 'excellent';
    if (winRate >= 0.55) return 'good';
    if (winRate >= 0.45) return 'average';
    return 'poor';
}

/**
 * Calculate favorability in a matchup based on win rate
 */
export function calculateFavorability(winRate: number): 'heavily_favored' | 'favored' | 'even' | 'unfavored' | 'heavily_unfavored' {
    if (winRate >= 0.65) return 'heavily_favored';
    if (winRate >= 0.55) return 'favored';
    if (winRate >= 0.45) return 'even';
    if (winRate >= 0.35) return 'unfavored';
    return 'heavily_unfavored';
}

// Interface definitions
export interface DeckComposition {
    units: number;
    spells: number;
    sites: number;
    elements: { air: number; earth: number; fire: number; water: number };
    manaCurve: number[];
    averageCost: number;
}
