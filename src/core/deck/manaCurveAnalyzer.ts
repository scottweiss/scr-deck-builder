import { Card } from '../../types/Card';

/**
 * Interface for mana curve adjustments
 */
export interface ManaCurveAdjustments {
    [manaCost: string]: number;
}

/**
 * Interface for ideal mana curve distribution
 */
export interface IdealManaCurve {
    [manaCost: number]: number;
}

/**
 * Interface for mana cost distribution
 */
export interface ManaCostDistribution {
    [manaCost: number]: number;
}

/**
 * Interface for critical mana cost requirements
 */
export interface CriticalManaCosts {
    [manaCost: number]: number;
}

/**
 * Get ideal mana curve based on archetype
 * @param archetype The deck archetype
 * @returns Ideal mana curve distribution
 */
export function getIdealManaCurve(archetype: string | null): IdealManaCurve {
    if (!archetype) {
        // Default balanced curve
        return {
            0: 0.04,  // 4% - Very few 0-cost cards
            1: 0.12,  // 12% - Early game presence
            2: 0.20,  // 20% - Core early-mid game
            3: 0.24,  // 24% - Peak efficiency zone
            4: 0.18,  // 18% - Mid-game power
            5: 0.12,  // 12% - Late game threats
            6: 0.06,  // 6% - High-impact finishers
            7: 0.04   // 4% - Game-ending spells
        };
    }

    if (archetype === "Aggro") {
        return {
            0: 0.05,  // 5% - More 0-cost for aggro
            1: 0.20,  // 20% - Heavy early presence
            2: 0.25,  // 25% - Core curve for aggro
            3: 0.25,  // 25% - Mid-curve peak
            4: 0.15,  // 15% - Fewer high-cost cards
            5: 0.06,  // 6% - Limited top-end
            6: 0.03,  // 3% - Very few finishers
            7: 0.01   // 1% - Almost no ultra-high cost
        };
    } else if (archetype === "Control") {
        return {
            0: 0.03,  // 3% - Fewer 0-cost (utility only)
            1: 0.10,  // 10% - Early defense
            2: 0.15,  // 15% - Early control tools
            3: 0.20,  // 20% - Core control cards
            4: 0.22,  // 22% - Primary control zone
            5: 0.15,  // 15% - Strong late-game
            6: 0.10,  // 10% - More finishers
            7: 0.05   // 5% - Game-ending threats
        };
    } else if (archetype.includes("Synergy") || archetype === "Combo") {
        return {
            0: 0.06,  // 6% - More combo pieces
            1: 0.14,  // 14% - Setup cards
            2: 0.22,  // 22% - Core combo pieces
            3: 0.22,  // 22% - Combo development
            4: 0.18,  // 18% - Mid-game power
            5: 0.10,  // 10% - Combo finishers
            6: 0.05,  // 5% - High impact cards
            7: 0.03   // 3% - Ultimate finishers
        };
    } else {
        // Default balanced curve for other archetypes
        return {
            0: 0.04,  // 4% - Very few 0-cost cards
            1: 0.12,  // 12% - Early game presence
            2: 0.20,  // 20% - Core early-mid game
            3: 0.24,  // 24% - Peak efficiency zone
            4: 0.18,  // 18% - Mid-game power
            5: 0.12,  // 12% - Late game threats
            6: 0.06,  // 6% - High-impact finishers
            7: 0.04   // 4% - Game-ending spells
        };
    }
}

/**
 * Calculate current mana curve from cards
 * @param cards Cards to analyze
 * @returns Mana cost distribution
 */
export function calculateCurrentCurve(cards: Card[]): ManaCostDistribution {
    const manaCosts = cards.map(card => card.mana_cost || 0);
    const currentCurve: ManaCostDistribution = {};
    
    manaCosts.forEach(cost => {
        const adjustedCost = Math.min(cost, 7); // Cap at 7+ for analysis
        currentCurve[adjustedCost] = (currentCurve[adjustedCost] || 0) + 1;
    });
    
    return currentCurve;
}

/**
 * Get critical mana cost requirements for playability
 * @returns Critical mana cost thresholds
 */
export function getCriticalManaCosts(): CriticalManaCosts {
    return {
        0: 1,  // At least 1 zero-cost card
        1: 5,  // At least 5 one-drops
        2: 6,  // At least 6 two-drops
        3: 6,  // At least 6 three-drops
        4: 5,  // At least 5 four-drops
        5: 3,  // At least 3 five-drops
        6: 2,  // At least 2 six-drops
        7: 1   // At least 1 seven-drop
    };
}

/**
 * Calculate mana curve adjustments based on current distribution and targets
 * @param currentCurve Current mana distribution
 * @param criticalCosts Critical mana cost requirements
 * @returns Adjustments needed for each mana cost
 */
export function calculateManaCurveAdjustments(
    currentCurve: ManaCostDistribution,
    criticalCosts: CriticalManaCosts
): ManaCurveAdjustments {
    const adjustments: ManaCurveAdjustments = {};
    
    // First, ensure we have minimum playable cards at each mana cost
    for (const [cost, minCount] of Object.entries(criticalCosts)) {
        const currentCount = currentCurve[parseInt(cost)] || 0;
        
        // If we have less than minimum, prioritize adding cards at this cost
        if (currentCount < minCount) {
            adjustments[cost] = minCount - currentCount;
            console.log(`Need ${adjustments[cost]} more ${cost}-cost cards for playability`);
        }
        // If we have more than 1.5x minimum, consider removing some (but not aggressively)
        else if (currentCount > minCount * 1.5 && currentCount > 5) {
            // Only remove excess cards if we have a lot more than needed
            const excessCount = currentCount - Math.ceil(minCount * 1.5);
            // Be conservative - only remove at most half of excess
            adjustments[cost] = -Math.floor(excessCount / 2);
            console.log(`Can potentially remove up to ${Math.abs(adjustments[cost])} ${cost}-cost cards`);
        } 
        // Otherwise, the count is good for playability
        else {
            adjustments[cost] = 0;
        }
    }
    
    return adjustments;
}

/**
 * Get priority order for mana cost adjustments
 * @param adjustments Mana curve adjustments
 * @returns Costs ordered by priority
 */
export function getPriorityCosts(adjustments: ManaCurveAdjustments): Array<[string, number]> {
    return Object.entries(adjustments)
        .filter(([_, adj]) => adj > 0)
        .sort((a, b) => {
            // Prioritize early drops (costs 0-3) first
            const costA = parseInt(a[0]);
            const costB = parseInt(b[0]);
            
            // Critical early game cards get highest priority
            if (costA <= 3 && costB > 3) return -1;
            if (costB <= 3 && costA > 3) return 1;
            
            // Otherwise sort by cost (cheaper first)
            return costA - costB;
        });
}
