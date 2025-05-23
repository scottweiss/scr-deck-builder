/**
 * Default exports for the Sorcery: Contested Realm system
 * This file automatically uses the optimized system when available
 */

import { SYSTEM_MODE, SYSTEM_PATHS } from './config';

// Use optimized system (now the only system)
const utils = require('./utils/utils');
const sorceryCards = require('./data/processed/sorceryCards');

const cardAnalysis = require('./core/cards/cardAnalysis');
const synergyCalculator = require('./analyses/synergy/synergyCalculator');
const deckBuilder = require('./core/deck/deckBuilder');
const deckValidator = require('./core/deck/deckValidator');
const elementAnalyzer = require('./analyses/position/elementRequirementAnalyzer');

// Export the commonly used modules
module.exports = {
    // Core functionality
    utils,
    sorceryCards,
    cardAnalysis,
    synergyCalculator,
    deckBuilder,
    deckValidator,
    elementAnalyzer,
    
    // Helper function to check if optimized mode is enabled (always returns true now)
    isOptimized: () => true,
    
    // Helper function to get current system paths
    getPaths: () => SYSTEM_PATHS
};
