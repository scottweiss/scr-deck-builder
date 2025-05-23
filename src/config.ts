/**
 * Global configuration settings for Sorcery: Contested Realm
 */

// System mode configuration
export const SYSTEM_MODE = {
  OPTIMIZED: process.env.NODE_OPTIMIZED === 'true',
  DEBUG: process.env.NODE_ENV === 'development',
};

// Paths for different system modes
export const SYSTEM_PATHS = {
  UTILS: SYSTEM_MODE.OPTIMIZED 
    ? './optimization/utils.optimized' 
    : './utils/utils',
  CARDS: SYSTEM_MODE.OPTIMIZED 
    ? './optimization/sorceryCards.optimized' 
    : './data/processed/sorceryCards',
  PROCESS: SYSTEM_MODE.OPTIMIZED 
    ? './optimization/processCards.optimized' 
    : './data/processed/processCards',
};

// Performance settings
export const PERFORMANCE_CONFIG = {
  CACHE_SIZE: 10000,
  ENABLE_MEMOIZATION: true,
  BATCH_SIZE: 1000,
};

// Feature flags
export const FEATURES = {
  USE_OPTIMIZED_ALGORITHMS: SYSTEM_MODE.OPTIMIZED,
  ENABLE_ADVANCED_SYNERGY: true,
  ENABLE_POSITION_ANALYSIS: true,
};

export default {
  SYSTEM_MODE,
  SYSTEM_PATHS,
  PERFORMANCE_CONFIG,
  FEATURES,
};
