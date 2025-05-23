import { Card, Element } from '../../types/Card';

/**
 * Represents a card with its elemental requirement amount
 */
export interface ElementRequirement {
    card: Card;
    amount: number;
}

/**
 * Element deficiency information
 */
export interface ElementDeficiency {
    current: number;
    required: number;
    deficit: number;
    cards: ElementRequirement[];
}

/**
 * Result of elemental requirements analysis
 */
export interface ElementAnalysis {
    elementCounts: Record<Element, number>;
    elementThresholds: Record<Element, number>;
    elementRequirements: Record<Element, ElementRequirement[]>;
    elementDeficiencies: Record<Element, ElementDeficiency>;
}

/**
 * Analyzes the elemental requirements of cards in a deck
 * @param deck Current cards in the deck
 * @returns Analysis of elemental requirements
 */
export function analyzeElementalRequirements(deck: Card[]): ElementAnalysis {
    if (!deck || !Array.isArray(deck)) {
        const emptyRecord = {
            Water: 0,
            Fire: 0,
            Earth: 0,
            Air: 0,
            Void: 0
        };
        const emptyRequirements = {
            Water: [],
            Fire: [],
            Earth: [],
            Air: [],
            Void: []
        };
        return {
            elementCounts: { ...emptyRecord },
            elementThresholds: { ...emptyRecord },
            elementRequirements: { ...emptyRequirements },
            elementDeficiencies: {} as Record<Element, ElementDeficiency>
        };
    }
    
    // Track element counts and requirements
    const elementCounts: Record<Element, number> = {
        Water: 0,
        Fire: 0,
        Earth: 0,
        Air: 0,
        Void: 0
    };
    const elementThresholds: Record<Element, number> = {
        Water: 0,
        Fire: 0,
        Earth: 0,
        Air: 0,
        Void: 0
    };
    const elementRequirements: Record<Element, ElementRequirement[]> = {
        Water: [],
        Fire: [],
        Earth: [],
        Air: [],
        Void: []
    };
    
    // Analyze element sources and requirements
    for (const card of deck) {
        // Track elements provided by this card
        const elements = card.elements || [];
        for (const element of elements) {
            elementCounts[element] = (elementCounts[element] || 0) + 1;
        }
        
        // Look for element threshold requirements in text
        const text = (card.text || "").toLowerCase();
        // Parse threshold requirements like "requires 3 water"
        const thresholdMatches = text.match(/requires? (\d+) (water|earth|fire|air|void)/gi) || [];
        
        for (const match of thresholdMatches) {
            const parts = match.toLowerCase().match(/requires? (\d+) (water|earth|fire|air|void)/i);
            if (parts && parts.length === 3) {
                const amount = parseInt(parts[1], 10);
                const elementStr = parts[2];
                const element = elementStr.charAt(0).toUpperCase() + elementStr.slice(1) as Element;
                
                // Track the highest threshold for each element
                if (!elementThresholds[element] || amount > elementThresholds[element]) {
                    elementThresholds[element] = amount;
                }
                
                // Track cards requiring specific elements
                if (!elementRequirements[element]) {
                    elementRequirements[element] = [];
                }
                elementRequirements[element].push({
                    card,
                    amount
                });
            }
        }
    }
    
    // Calculate element deficiencies (where count < threshold)
    const elementDeficiencies: Record<Element, ElementDeficiency> = {
        Water: { current: 0, required: 0, deficit: 0, cards: [] },
        Fire: { current: 0, required: 0, deficit: 0, cards: [] },
        Earth: { current: 0, required: 0, deficit: 0, cards: [] },
        Air: { current: 0, required: 0, deficit: 0, cards: [] },
        Void: { current: 0, required: 0, deficit: 0, cards: [] }
    };
    for (const element in elementThresholds) {
        const typedElement = element as Element;
        const count = elementCounts[typedElement] || 0;
        const threshold = elementThresholds[typedElement] || 0;
        
        if (count < threshold) {
            elementDeficiencies[typedElement] = {
                current: count,
                required: threshold,
                deficit: threshold - count,
                cards: elementRequirements[typedElement] || []
            };
        }
    }
    
    return {
        elementCounts,
        elementThresholds,
        elementRequirements,
        elementDeficiencies
    };
}

/**
 * Calculate how much a card contributes to fixing elemental deficits
 * @param card Card to evaluate
 * @param analysis Current elemental analysis
 * @returns Score indicating how well the card addresses deficiencies
 */
export function calculateElementalDeficitContribution(card: Card, analysis: ElementAnalysis): number {
    let score = 0;
    const cardElements = card.elements || [];
    
    for (const element of cardElements) {
        if (analysis.elementDeficiencies[element]) {
            // Card provides an element we're deficient in
            const deficit = analysis.elementDeficiencies[element].deficit;
            score += deficit * 2; // Weight deficit fixing highly
        }
    }
    
    return score;
}

/**
 * Get recommended cards to fix elemental deficiencies
 * @param availableCards Pool of available cards
 * @param analysis Current elemental analysis
 * @returns Array of cards sorted by how well they fix deficiencies
 */
export function getElementalRecommendations(availableCards: Card[], analysis: ElementAnalysis): Card[] {
    return availableCards
        .map(card => ({
            card,
            score: calculateElementalDeficitContribution(card, analysis)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.card);
}
