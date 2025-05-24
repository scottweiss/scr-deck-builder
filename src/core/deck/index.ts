/**
 * Main entry point for the deck building system
 * This file re-exports all functionality from the organized submodules
 */

// Export from allocation module
export { calculateCardAllocation, AllocationResult } from './allocation/cardAllocation';
export { getMaxCopiesForRarity, addCardWithCopies, enforceRarityLimits, CopiesInDeck } from './allocation/rarityManager';
export { isUtilityArtifact, sortArtifactsWithUtilityPriority } from './allocation/utilityArtifactPrioritizer';

// Export from analysis module
export { analyzeDeckComposition, logDeckPlayabilityAnalysis, DeckAnalysisResults, DeckStats } from './analysis/deckAnalyzer';
export { DeckValidator } from './analysis/deckValidator';
export { DeckValidationResult } from '../../types/Deck';
export { analyzeCardCombos } from './analysis/comboDetection';
export { 
    getIdealManaCurve,
    calculateCurrentCurve,
    getCriticalManaCosts,
    calculateManaCurveAdjustments,
    getPriorityCosts,
    ManaCurveAdjustments,
    IdealManaCurve,
    ManaCostDistribution,
    CriticalManaCosts
} from './analysis/manaCurveAnalyzer';

// Export from builder module
export { buildSpellbook, buildCompleteDeck } from './builder/deckBuilder';
export { selectMinions, selectAuras, selectMagics } from './builder/cardSelection';
export { isComboCard, sortMinions, sortAuras, sortMagics } from './builder/cardSorting';
export { completeDeckWithSynergyCards, addElementalFixingCards } from './builder/deckCompletion';
export { exportToJson } from './builder/deckExporter';

// Export from optimization module
export { optimizeDeck } from './optimization/deckOptimizer';
export { 
    findCandidatesOfCost,
    sortCardsByStrategicValue,
    sortCardsByRegionalStrategy,
    addCardsRespectingRarity,
    removeCardsStrategically
} from './optimization/cardSelector';
