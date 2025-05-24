/**
 * Entry point for using the unified Sorcery deck builder in browser contexts
 * This script simplifies the initialization and usage of the deck builder
 */

// Import the SorceryDeckBuilder class
// This will be available as a global variable when using the bundled version
if (typeof SorceryDeckBuilder === 'undefined' && typeof require === 'function') {
  // In environments with require (e.g., testing with Node.js)
  globalThis.SorceryDeckBuilder = require('../../dist/sorcery-deck-builder').default;
}

/**
 * Initialize the deck builder and return it ready to use
 */
async function initializeDeckBuilder() {
  console.log('Initializing unified Sorcery deck builder...');
  
  try {
    // Create instance
    const builder = new SorceryDeckBuilder();
    
    // Initialize with card data
    await builder.initialize();
    
    console.log('Unified deck builder initialized successfully!');
    return builder;
  } catch (error) {
    console.error('Failed to initialize deck builder:', error);
    throw error;
  }
}

/**
 * Build a deck with the specified options
 */
async function buildDeck(options = {}) {
  const builder = await initializeDeckBuilder();
  
  const defaultOptions = {
    preferredElement: 'Fire',
    maxCards: 50
  };
  
  const buildOptions = { ...defaultOptions, ...options };
  console.log('Building deck with options:', buildOptions);
  
  const result = await builder.buildDeck(buildOptions);
  console.log('Deck built successfully:', result);
  
  return result;
}

/**
 * Search for cards matching a query
 */
async function searchCards(query) {
  const builder = await initializeDeckBuilder();
  return builder.searchCards(query);
}

/**
 * Get available elements
 */
async function getElements() {
  const builder = await initializeDeckBuilder();
  return builder.getAvailableElements();
}

/**
 * Get available archetypes
 */
async function getArchetypes() {
  const builder = await initializeDeckBuilder();
  return builder.getAvailableArchetypes();
}

// Export the API for direct usage
const SorceryUnifiedDeckBuilder = {
  initialize: initializeDeckBuilder,
  buildDeck,
  searchCards,
  getElements,
  getArchetypes
};

// Add to global scope for browser use
if (typeof window !== 'undefined') {
  window.SorceryUnifiedDeckBuilder = SorceryUnifiedDeckBuilder;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SorceryUnifiedDeckBuilder;
}
