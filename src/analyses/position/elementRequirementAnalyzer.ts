import { Card, Element } from '../../types/Card';
import { getCardThreshold, getCardElementalAffinity, getCardManaGeneration } from '../../utils/utils';

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
 * @param deck Current cards in the deck (spells only - sites should be passed separately)
 * @param sites Optional sites array to calculate available elemental affinity
 * @returns Analysis of elemental requirements
 */
export function analyzeElementalRequirements(deck: Card[], sites?: Card[]): ElementAnalysis {
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
    
    // Track elemental affinity from sites (what we have available)
    const elementCounts: Record<Element, number> = {
        Water: 0,
        Fire: 0,
        Earth: 0,
        Air: 0,
        Void: 0
    };
    
    // Calculate elemental affinity from sites (if provided)
    if (sites && Array.isArray(sites)) {
        for (const site of sites) {
            // Sites provide elemental affinity through their processed affinity data
            const siteAffinity = getCardElementalAffinity(site);
            for (const [element, amount] of Object.entries(siteAffinity)) {
                const typedElement = element as Element;
                elementCounts[typedElement] = (elementCounts[typedElement] || 0) + amount;
            }
        }
    }
    
    // Track threshold requirements from spells
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
    
    // Analyze threshold requirements from spells
    for (const card of deck) {
        // Only analyze threshold requirements for spell cards
        // Sites are analyzed above for elemental affinity
        if (card.type === 'Site') {
            continue; // Skip sites in the spell analysis
        }
        
        // Parse threshold requirements using the proper threshold parsing function
        try {
            const cardThresholds = getCardThreshold(card);
            
            for (const [elementName, amount] of Object.entries(cardThresholds)) {
                if (amount > 0) {
                    const element = elementName as Element;
                    
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
        } catch (error) {
            console.error(`Error parsing thresholds for card ${card.name}:`, error);
        }
    }
    
    // Calculate element deficiencies (where available affinity < required threshold)
    const elementDeficiencies: Record<Element, ElementDeficiency> = {
        Water: { current: 0, required: 0, deficit: 0, cards: [] },
        Fire: { current: 0, required: 0, deficit: 0, cards: [] },
        Earth: { current: 0, required: 0, deficit: 0, cards: [] },
        Air: { current: 0, required: 0, deficit: 0, cards: [] },
        Void: { current: 0, required: 0, deficit: 0, cards: [] }
    };
    
    for (const element in elementThresholds) {
        const typedElement = element as Element;
        const availableAffinity = elementCounts[typedElement] || 0;
        const requiredThreshold = elementThresholds[typedElement] || 0;
        
        if (requiredThreshold > 0) { // Only create deficiency entries for elements that are actually required
            elementDeficiencies[typedElement] = {
                current: availableAffinity,
                required: requiredThreshold,
                deficit: Math.max(0, requiredThreshold - availableAffinity),
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
