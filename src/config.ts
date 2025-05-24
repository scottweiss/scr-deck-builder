/**
 * Global configuration settings for Sorcery: Contested Realm
 */

// System mode configuration
export const SYSTEM_MODE = {
  DEBUG: false, // Explicitly set to false to suppress debug messages during deck building
};

// Direct paths to optimized utilities
export const SYSTEM_PATHS = {
  UTILS: './utils/utils',
  CARDS: './data/processed/sorceryCards',
  PROCESS: './data/processed/processCards',
};

// Performance settings
export const PERFORMANCE_CONFIG = {
  CACHE_SIZE: 10000,
  ENABLE_MEMOIZATION: true,
  BATCH_SIZE: 1000,
};

// Feature flags
export const FEATURES = {
  USE_OPTIMIZED_ALGORITHMS: true, // Always use optimized algorithms
  ENABLE_ADVANCED_SYNERGY: true,
  ENABLE_POSITION_ANALYSIS: true,
};

export default {
  SYSTEM_MODE,
  SYSTEM_PATHS,
  PERFORMANCE_CONFIG,
  FEATURES,
};
