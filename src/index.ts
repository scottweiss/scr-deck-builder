/**
 * Default exports for the Sorcery: Contested Realm system
 * This file automatically uses the optimized system when available
 */

import { SYSTEM_MODE, SYSTEM_PATHS } from './config';
import * as utils from './utils/utils';
import * as sorceryCards from './data/processed/sorceryCards';
import * as cardAnalysis from './core/cards/cardAnalysis';
import * as synergyCalculator from './analyses/synergy/synergyCalculator';
import * as deckBuilder from './core/deck/builder/deckBuilder';
import * as deckValidator from './core/deck/analysis/deckValidator';
import * as elementAnalyzer from './analyses/position/elementRequirementAnalyzer';

// Export the commonly used modules
export {
    // Core functionality
    utils,
    sorceryCards,
    cardAnalysis,
    synergyCalculator,
    deckBuilder,
    deckValidator,
    elementAnalyzer,
    
    // Helper function to check if optimized mode is enabled (always returns true now)
    SYSTEM_MODE,
    SYSTEM_PATHS
};

// Default export for compatibility
export default {
    utils,
    sorceryCards,
    cardAnalysis,
    synergyCalculator,
    deckBuilder,
    deckValidator,
    elementAnalyzer,
    isOptimized: () => true,
    getPaths: () => SYSTEM_PATHS
};
