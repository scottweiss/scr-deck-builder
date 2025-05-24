import { Card } from '../../types/Card';
import { calculateSynergy } from '../../analyses/synergy/synergyCalculator';
import { evaluateRegionalStrategy } from '../cards/cardAnalysis';
import { analyzeElementalRequirements } from '../../analyses/position/elementRequirementAnalyzer';

// Import our new modular functions
import { CopiesInDeck } from './rarityManager';
import {
    getIdealManaCurve,
    calculateCurrentCurve,
    getCriticalManaCosts,
    calculateManaCurveAdjustments,
    getPriorityCosts
} from './manaCurveAnalyzer';
import {
    findCandidatesOfCost,
    sortCardsByStrategicValue,
    sortCardsByRegionalStrategy,
    addCardsRespectingRarity,
    removeCardsStrategically
} from './cardSelector';
import { logDeckPlayabilityAnalysis } from './deckAnalyzer';

/**
 * Optimize a deck based on various strategic factors
 * @param selectedSpells Current spell selection
 * @param minions Available minions
 * @param artifacts Available artifacts
 * @param auras Available auras
 * @param magics Available magics
 * @param preferredArchetype Optional preferred archetype to optimize for
 * @returns Optimized deck
 */
export function optimizeDeck(
    selectedSpells: Card[],
    minions: Card[],
    artifacts: Card[],
    auras: Card[],
    magics: Card[],
    preferredArchetype?: string
): Card[] {
    // Get synergy calculator and card combo system
    const synergyCalculator = require('../../analyses/synergy/synergyCalculator');
    const cardCombos = require('../cards/cardCombos');
    
    console.log("Analyzing elemental requirements and thresholds...");
    const elementalAnalysis = analyzeElementalRequirements(selectedSpells, []); // Pass empty sites array since not available in this context
    const hasElementDeficiencies = Object.keys(elementalAnalysis.elementDeficiencies || {}).length > 0;
    
    if (hasElementDeficiencies) {
        console.log("Elemental threshold requirements need optimization:");
        for (const [element, info] of Object.entries(elementalAnalysis.elementDeficiencies)) {
            console.log(`- ${element}: ${info.current}/${info.required} (deficit: ${info.deficit})`);
        }
    } else {
        console.log("Elemental thresholds are satisfactory.");
    }
    
    // Analyze the current deck for combos and archetypes
    const deckAnalysis = synergyCalculator.getDeckAnalysis(selectedSpells);
    const combos = deckAnalysis?.combos || [];
    const archetypes = deckAnalysis?.archetypes || [];
    
    // Determine the primary elements and archetypes with enhanced weighting
    const elementFrequency: Record<string, number> = {};
    for (const card of selectedSpells) {
        (card.elements || []).forEach(element => {
            // Weight elements by card impact (mana cost can be a proxy for importance)
            const weight = 1 + (card.mana_cost || 0) * 0.1;
            elementFrequency[element] = (elementFrequency[element] || 0) + weight;
        });
    }
    
    const sortedElements = Object.entries(elementFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    
    const primaryElement = sortedElements[0];
    
    // Get the top archetypes
    const topArchetypes = Object.entries(archetypes)
        .sort((a: [string, unknown], b: [string, unknown]) => (b[1] as number) - (a[1] as number))
        .filter((entry: [string, unknown]) => (entry[1] as number) > 1)
        .map((entry: [string, unknown]) => entry[0]);
    
    // Use the preferred archetype if specified, otherwise use the detected one
    const primaryArchetype = preferredArchetype || (topArchetypes.length > 0 ? topArchetypes[0] : null);
    
    // Get ideal mana curve based on archetype
    const idealCurve = getIdealManaCurve(primaryArchetype);
    
    if (primaryArchetype) {
        console.log(`Optimizing for ${primaryArchetype} archetype`);
    }

    // Calculate current mana curve and required adjustments
    const currentCurve = calculateCurrentCurve(selectedSpells);
    const criticalManaCosts = getCriticalManaCosts();
    const adjustments = calculateManaCurveAdjustments(currentCurve, criticalManaCosts);
    
    console.log("Analyzing deck playability by mana cost...");

    // Start with current spells and make adjustments
    let optimizedSpells = [...selectedSpells];

    // Remove cards from severely overcrowded costs
    for (const [cost, adjustment] of Object.entries(adjustments)) {
        if (adjustment < 0) {
            optimizedSpells = removeCardsStrategically(
                optimizedSpells,
                Math.abs(adjustment),
                parseInt(cost),
                combos
            );
        }
    }

    // Prepare candidates for addition
    const allCandidates = [...minions, ...artifacts, ...auras, ...magics];
    
    // Get priority order for adding cards
    const priorityCosts = getPriorityCosts(adjustments);
    
    console.log("Adding cards in priority order:", priorityCosts.map(c => c[0]).join(", "));
    
    // Process each cost in priority order
    for (const [cost, adjustment] of priorityCosts) {
        const adjustedCost = Math.min(parseInt(cost), 7);
        
        // Find candidates of this cost
        let candidates = findCandidatesOfCost(
            allCandidates,
            adjustedCost,
            optimizedSpells,
            adjustment
        );

        // Sort candidates by strategic value
        candidates = sortCardsByStrategicValue(candidates, optimizedSpells);

        // Add the best candidates while respecting rarity limits
        optimizedSpells = addCardsRespectingRarity(candidates, optimizedSpells, adjustment);
    }

    // Apply regional strategy prioritization
    const strategy = evaluateRegionalStrategy(selectedSpells);
    if (strategy !== "mixed") {
        const strategySortedCandidates = sortCardsByRegionalStrategy(
            allCandidates,
            optimizedSpells,
            strategy
        );
        
        console.log(`Applying ${strategy} regional strategy prioritization`);
        // This could be extended to replace some cards with strategy-matching ones
    }

    // Ensure we don't exceed 50 cards
    const finalDeck = optimizedSpells.slice(0, 50);
    
    // Log final analysis
    logDeckPlayabilityAnalysis(finalDeck);
    
    return finalDeck;
}
