/**
 * Optimized Sorcery Card Data Loader
 * 
 * This module provides lazy loading and caching for card data,
 * with automatic decompression from the compressed format.
 * 
 * Generated: 2025-05-24T18:51:16.500Z
 */

const compressedData = require('./sorceryCards.data');

let cachedCards = null;

/**
 * Decompress a single card from array format back to object
 */
function decompressCard(cardArray) {
    const card = {};
    compressedData.keys.forEach((key, index) => {
        if (cardArray[index] !== null) {
            card[key] = cardArray[index];
        }
    });
    return card;
}

/**
 * Get all cards (lazy loaded and cached)
 */
function getAllCards() {
    if (!cachedCards) {
        console.log('Decompressing card data...');
        const startTime = Date.now();
        
        cachedCards = compressedData.cards.map(decompressCard);
        
        const endTime = Date.now();
        console.log(`Decompressed ${cachedCards.length} cards in ${endTime - startTime}ms`);
    }
    return cachedCards;
}

/**
 * Get cards filtered by set
 */
function getCardsBySet(setName) {
    return getAllCards().filter(card => card.setName === setName);
}

/**
 * Get card count without loading all data
 */
function getCardCount() {
    return compressedData.stats.total;
}

/**
 * Get statistics without loading all data
 */
function getStats() {
    return compressedData.stats;
}

module.exports = {
    getAllCards,
    getCardsBySet,
    getCardCount,
    getStats,
    getBetaCards: () => getCardsBySet('Beta'),
    getArthurianCards: () => getCardsBySet('ArthurianLegends')
};
