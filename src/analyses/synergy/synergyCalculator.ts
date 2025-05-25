import { Card } from '../../types/Card';
import { calculateArchetypeSynergy } from '../../core/cards/cardCombos';

import { getDeckAnalysis, clearAnalysisCache } from './deckAnalysisCache';
import { calculateMechanicSynergy } from './mechanicalSynergy';
import { calculateElementalSynergy } from './elementalSynergy';
import { calculateCostCurveSynergy } from './costCurveSynergy';
import { calculateComboContribution } from './comboContribution';

// Re-export functions for backward compatibility
export { getDeckAnalysis, clearAnalysisCache } from './deckAnalysisCache';
export { calculateMechanicSynergy } from './mechanicalSynergy';
export { calculateElementalSynergy } from './elementalSynergy';
export { calculateCostCurveSynergy } from './costCurveSynergy';
export { calculateComboContribution } from './comboContribution';

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
    const comboContribution = calculateComboContribution(card, deck); // NEW: Better combo evaluation
    
    // Calculate archetype synergy by finding the best matching archetype
    let archetypeSynergy = 0;
    if (deckAnalysis.archetypes.length > 0) {
        const primaryArchetype = deckAnalysis.archetypes[0];
        archetypeSynergy = calculateArchetypeSynergy([card, ...deck], primaryArchetype.archetype);
    }
    
    // Weight and combine synergies with higher emphasis on combo contribution
    return (
        mechanicSynergy * 1.0 +
        elementalSynergy * 0.8 +
        costCurveSynergy * 0.6 +
        comboContribution * 2.0 +  // ENHANCED: Higher weight for combo contribution
        archetypeSynergy * 1.0
    );
}
