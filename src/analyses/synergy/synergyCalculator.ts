import { Card, Element, CardMechanics } from '../../types/Card';
import { identifyCardMechanics } from '../../core/cards/cardAnalysis';
import { 
    identifyCardCombos, 
    calculateComboSynergy, 
    identifyDeckArchetypes, 
    calculateArchetypeSynergy,
    Combo,
    ArchetypeMatch
} from '../../core/cards/cardCombos';

interface DeckAnalysis {
    combos: Combo[];
    archetypes: ArchetypeMatch[];
}

interface PositionalProfile {
    positions: Set<string>;
    controlsPositions: Set<string>;
    blocksPositions: Set<string>;
    enhancements: Set<string>;
}

const POSITION_TYPES = {
    UNDERGROUND: "underground",
    UNDERWATER: "underwater",
    AIRBORNE: "airborne",
    STANDARD: "standard",
    REGION: "region",
} as const;

type PositionType = typeof POSITION_TYPES[keyof typeof POSITION_TYPES];

/**
 * Cached deck analysis to avoid recalculating for each card
 */
const deckAnalysisCache = new Map<string, DeckAnalysis>();
const MAX_CACHE_SIZE = 10; // Limit cache size to avoid memory issues

/**
 * Get or calculate deck analysis (combos and archetypes)
 * @param deck Current deck being built
 * @returns Deck analysis with combos and archetypes
 */
export function getDeckAnalysis(deck: Card[]): DeckAnalysis {
    // Generate a cache key based on deck composition
    // Using card names joined with commas as a simple hash
    const cacheKey = deck.map(c => c.baseName || '').sort().join(',');
    
    // If we have this analysis cached, return it
    if (deckAnalysisCache.has(cacheKey)) {
        const cached = deckAnalysisCache.get(cacheKey);
        if (cached) {
            return cached;
        }
    }
    
    // Calculate fresh deck analysis
    const identifiedCombos = identifyCardCombos(deck);
    const identifiedArchetypes = identifyDeckArchetypes(deck);
    const analysis: DeckAnalysis = {
        combos: identifiedCombos ? identifiedCombos : [],
        archetypes: Array.isArray(identifiedArchetypes) ? identifiedArchetypes : []
    };
    
    // Cache the result
    if (deckAnalysisCache.size >= MAX_CACHE_SIZE) {
        // If cache is full, remove the oldest entry
        const oldestKey = Array.from(deckAnalysisCache.keys())[0];
        if (oldestKey) {
            deckAnalysisCache.delete(oldestKey);
        }
    }
    deckAnalysisCache.set(cacheKey, analysis);
    
    return analysis;
}

/**
 * Calculate mechanical synergy between a card and the current deck
 */
function calculateMechanicSynergy(card: Card, deck: Card[]): number {
    const cardMechanics = identifyCardMechanics(card);
    let synergy = 0;

    // Look for complementary mechanics
    for (const deckCard of deck) {
        const deckCardMechanics = identifyCardMechanics(deckCard);

        // Card draw synergizes with resource production
        if (cardMechanics.drawsCards && deckCardMechanics.producesResources) {
            synergy += 2;
        }

        // Direct damage synergizes with control
        if (cardMechanics.dealsDirectDamage && deckCardMechanics.controlsMinions) {
            synergy += 1.5;
        }

        // AOE damage synergizes with defensive mechanics
        if (cardMechanics.dealsAOEDamage && deckCardMechanics.supportsDefense) {
            synergy += 1.5;
        }

        // Minion enhancement synergizes with charge/airborne
        if (cardMechanics.enhancesMinions && 
            (deckCardMechanics.hasCharge || deckCardMechanics.hasAirborne)) {
            synergy += 2;
        }

        // Combat keywords synergize with each other
        if ((cardMechanics.hasStrikeFirst || cardMechanics.hasLethal) && 
            (deckCardMechanics.hasStrikeFirst || deckCardMechanics.hasLethal)) {
            synergy += 1;
        }

        // Regional synergies
        if (cardMechanics.operatesUnderground && deckCardMechanics.operatesUnderground) {
            synergy += 2;
        }
        if (cardMechanics.operatesUnderwater && deckCardMechanics.operatesUnderwater) {
            synergy += 2;
        }
        if (cardMechanics.operatesVoid && deckCardMechanics.operatesVoid) {
            synergy += 2;
        }
    }

    return synergy;
}

/**
 * Calculate elemental synergy between a card and the current deck
 */
function calculateElementalSynergy(card: Card, deck: Card[]): number {
    const cardElements = card.elements || [];
    let synergy = 0;
    
    // Count elements in deck
    const elementCounts: Record<string, number> = {};
    for (const deckCard of deck) {
        const elements = deckCard.elements || [];
        for (const element of elements) {
            elementCounts[element] = (elementCounts[element] || 0) + 1;
        }
    }
    
    // Calculate synergy based on shared elements
    for (const element of cardElements) {
        const count = elementCounts[element] || 0;
        synergy += Math.min(count, 5); // Cap element synergy at 5 per element
    }
    
    return synergy;
}

/**
 * Calculate cost curve synergy between a card and the current deck
 */
function calculateCostCurveSynergy(card: Card, deck: Card[]): number {
    const cardCost = card.mana_cost;
    let synergy = 0;
    
    // Count cards at each cost
    const costCounts: Record<number, number> = {};
    for (const deckCard of deck) {
        const cost = deckCard.mana_cost;
        costCounts[cost] = (costCounts[cost] || 0) + 1;
    }
    
    // Penalize overloaded costs, reward underrepresented costs
    const currentCount = costCounts[cardCost] || 0;
    const desiredCount = Math.max(6 - cardCost, 2); // Higher costs should have fewer cards
    
    if (currentCount < desiredCount) {
        synergy += 2; // Reward filling gaps in curve
    } else if (currentCount > desiredCount * 1.5) {
        synergy -= 1; // Penalize overloaded costs
    }
    
    return synergy;
}

/**
 * Calculate overall synergy between a card and the current deck
 */
export function calculateSynergy(card: Card, deck: Card[]): number {
    // Skip if no deck or card
    if (!card || !deck || deck.length === 0) return 0;
    
    // Get cached deck analysis
    const deckAnalysis = getDeckAnalysis(deck);
    
    // Calculate each type of synergy
    const mechanicSynergy = calculateMechanicSynergy(card, deck);
    const elementalSynergy = calculateElementalSynergy(card, deck);
    const costCurveSynergy = calculateCostCurveSynergy(card, deck);
    const comboSynergy = calculateComboSynergy([card, ...deck]);
    
    // Calculate archetype synergy by finding the best matching archetype
    let archetypeSynergy = 0;
    if (deckAnalysis.archetypes.length > 0) {
        const primaryArchetype = deckAnalysis.archetypes[0];
        archetypeSynergy = calculateArchetypeSynergy([card, ...deck], primaryArchetype.archetype);
    }
    
    // Weight and combine synergies
    return (
        mechanicSynergy * 1.0 +
        elementalSynergy * 0.8 +
        costCurveSynergy * 0.6 +
        comboSynergy * 1.2 +
        archetypeSynergy * 1.0
    );
}

/**
 * Clear the deck analysis cache
 */
export function clearAnalysisCache(): void {
    deckAnalysisCache.clear();
}
