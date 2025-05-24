/**
 * Browser-compatible Sorcery deck builder using real card data
 * This script reuses existing algorithms but with browser-compatible data loading
 */

// For browser compatibility, we'll load the compressed data via a script tag
// The compressed data will be available as window.COMPRESSED_CARD_DATA

/**
 * Load compressed card data from the global scope
 */
function loadCompressedData() {
    // Check if compressed data is available
    if (typeof window !== 'undefined' && window.COMPRESSED_CARD_DATA) {
        return window.COMPRESSED_CARD_DATA;
    }
    
    // Fallback - try to load from script
    try {
        // This will be loaded by including sorceryCards.compressed.js as a script tag
        return COMPRESSED_CARD_DATA;
    } catch (error) {
        console.error('Could not load compressed card data:', error);
        return { keys: [], cards: [], stats: { total: 0 } };
    }
}

/**
 * Decompress a single card from array format back to object
 */
function decompressCard(cardArray, keys) {
    const card = {};
    keys.forEach((key, index) => {
        if (cardArray[index] !== null) {
            card[key] = cardArray[index];
        }
    });
    return card;
}

/**
 * Element mapping from CSV notation to full names
 */
const ELEMENT_MAP = {
    'W': 'Water',
    'F': 'Fire', 
    'E': 'Earth',
    'A': 'Air',
    'V': 'Void'
};

/**
 * Parse threshold string like "WW" or "FF" into element requirements
 */
function parseThreshold(thresholdStr) {
    if (!thresholdStr) return {};
    
    const requirements = {};
    for (const char of thresholdStr.toUpperCase()) {
        if (ELEMENT_MAP[char]) {
            const element = ELEMENT_MAP[char];
            requirements[element] = (requirements[element] || 0) + 1;
        }
    }
    return requirements;
}

/**
 * Parse elements from element string
 */
function parseElements(elementStr) {
    if (!elementStr) return [];
    
    const elements = [];
    const chars = elementStr.split(',').join('').trim(); // Handle comma-separated or concatenated
    
    for (const char of chars.toUpperCase()) {
        if (ELEMENT_MAP[char] && !elements.includes(ELEMENT_MAP[char])) {
            elements.push(ELEMENT_MAP[char]);
        }
    }
    return elements;
}

/**
 * Determine archetype based on card properties (reused from existing logic)
 */
function determineArchetype(card) {
    const text = (card.rule_text || '').toLowerCase();
    const cost = card.mana_cost;
    const type = card.type;
    
    const archetypes = [];
    
    // Aggro indicators
    if (cost <= 3 || text.includes('charge') || text.includes('haste') || text.includes('attack')) {
        archetypes.push('Aggro');
    }
    
    // Control indicators  
    if (cost >= 5 || text.includes('counter') || text.includes('destroy') || text.includes('return') || 
        text.includes('draw') || type === 'Magic') {
        archetypes.push('Control');
    }
    
    // Midrange indicators
    if (cost >= 3 && cost <= 5 && type === 'Minion') {
        archetypes.push('Midrange');
    }
    
    // Combo indicators
    if (text.includes('whenever') || text.includes('when') || text.includes('if')) {
        archetypes.push('Combo');
    }
    
    return archetypes.length > 0 ? archetypes : ['Midrange'];
}

/**
 * Transform raw card data to browser format (reusing existing transformation logic)
 */
function transformCard(rawCard) {
    // Skip foil cards and non-card products
    if (rawCard.name.includes('(Foil)') || 
        rawCard.name.includes('Booster') ||
        rawCard.name.includes('Pack') ||
        !rawCard.extCardType ||
        rawCard.extCardType === '') {
        return null;
    }
    
    const manaCost = rawCard.extCost === 'X' ? 0 : parseInt(rawCard.extCost) || 0;
    const cardType = rawCard.extCardType;
    const elements = parseElements(rawCard.extElement);
    const power = parseInt(rawCard.extPowerRating) || 0;
    const defense = parseInt(rawCard.extDefensePower) || undefined;
    const life = parseInt(rawCard.extLife) || undefined;
    const rarity = rawCard.extRarity;
    
    const card = {
        name: rawCard.name,
        type: cardType,
        elements: elements,
        mana_cost: manaCost,
        rule_text: rawCard.extDescription || '',
        power: power,
        defense: defense,
        life: life,
        rarity: rarity,
        set: rawCard.setName || 'Beta',
        subtype: rawCard.extCardSubtype || undefined,
        threshold: rawCard.extThreshold || '',
        thresholdRequirements: parseThreshold(rawCard.extThreshold),
        image_url: rawCard.imageUrl || ''
    };
    
    // Add archetype
    card.archetype = determineArchetype(card);
    
    return card;
}

/**
 * Smart deck building algorithm (adapted from existing cardSelector.ts)
 */
function buildSmartDeck(availableCards, preferences = {}) {
    const {
        preferredElements = [],
        preferredArchetype = 'Midrange',
        avatarName = null
    } = preferences;
    
    console.log('Building deck with preferences:', preferences);
    
    // Filter cards by preferences
    let candidateCards = availableCards.filter(card => {
        // Exclude sites and avatars from deck
        if (card.type === 'Site' || card.type === 'Avatar') return false;
        
        // Prefer cards that match archetype
        if (preferredArchetype && card.archetype && card.archetype.includes(preferredArchetype)) {
            return true;
        }
        
        // Include cards that match preferred elements
        if (preferredElements.length > 0) {
            return card.elements.some(element => preferredElements.includes(element));
        }
        
        return true;
    });
    
    // Optimal mana curve distribution (from existing algorithm)
    const targetDistribution = {
        1: 8,   // 1 mana
        2: 12,  // 2 mana
        3: 10,  // 3 mana
        4: 8,   // 4 mana
        5: 6,   // 5 mana
        6: 4,   // 6+ mana
        7: 2    // 7+ mana
    };
    
    const deck = [];
    const maxCopies = 4; // Standard Sorcery deck building rule
    const deckSize = 50; // Standard Sorcery deck size
    
    // Build deck following mana curve
    for (const [costStr, targetCount] of Object.entries(targetDistribution)) {
        const cost = parseInt(costStr);
        let addedThisCost = 0;
        
        // Find cards of this cost
        const costCards = candidateCards.filter(card => {
            const cardCost = Math.min(card.mana_cost || 0, 7);
            return cardCost === cost;
        }).sort((a, b) => {
            // Prioritize by archetype match, then by element match
            const aScore = (a.archetype?.includes(preferredArchetype) ? 2 : 0) +
                          (a.elements.some(e => preferredElements.includes(e)) ? 1 : 0);
            const bScore = (b.archetype?.includes(preferredArchetype) ? 2 : 0) +
                          (b.elements.some(e => preferredElements.includes(e)) ? 1 : 0);
            return bScore - aScore;
        });
        
        for (const card of costCards) {
            if (addedThisCost >= targetCount || deck.length >= deckSize) break;
            
            // Check how many copies we already have
            const currentCopies = deck.filter(c => c.name === card.name).length;
            if (currentCopies < maxCopies) {
                const copiesToAdd = Math.min(
                    maxCopies - currentCopies,
                    targetCount - addedThisCost,
                    deckSize - deck.length
                );
                
                for (let i = 0; i < copiesToAdd; i++) {
                    deck.push({...card});
                    addedThisCost++;
                }
            }
        }
    }
    
    // Fill remaining slots with best available cards
    while (deck.length < deckSize && candidateCards.length > 0) {
        const remainingCards = candidateCards.filter(card => {
            const currentCopies = deck.filter(c => c.name === card.name).length;
            return currentCopies < maxCopies;
        });
        
        if (remainingCards.length === 0) break;
        
        // Pick the best available card
        const bestCard = remainingCards[0];
        deck.push({...bestCard});
    }
    
    return deck;
}

/**
 * Calculate deck statistics
 */
function calculateDeckStats(deck) {
    const stats = {
        totalCards: deck.length,
        manaCurve: {},
        elements: {},
        types: {},
        archetypes: {},
        averageManaCost: 0
    };
    
    let totalCost = 0;
    
    deck.forEach(card => {
        // Mana curve
        const cost = Math.min(card.mana_cost || 0, 7);
        stats.manaCurve[cost] = (stats.manaCurve[cost] || 0) + 1;
        totalCost += card.mana_cost || 0;
        
        // Elements
        card.elements.forEach(element => {
            stats.elements[element] = (stats.elements[element] || 0) + 1;
        });
        
        // Types
        stats.types[card.type] = (stats.types[card.type] || 0) + 1;
        
        // Archetypes
        card.archetype.forEach(archetype => {
            stats.archetypes[archetype] = (stats.archetypes[archetype] || 0) + 1;
        });
    });
    
    stats.averageManaCost = deck.length > 0 ? (totalCost / deck.length).toFixed(2) : 0;
    
    return stats;
}

/**
 * Main deck builder class
 */
class RealSorceryDeckBuilder {
    constructor() {
        this.cards = [];
        this.avatars = [];
        this.sites = [];
        this.loaded = false;
    }
    
    /**
     * Load and process real card data
     */
    async loadCardData() {
        if (this.loaded) return;
        
        console.log('Loading real Sorcery card data...');
        const startTime = Date.now();
        
        // Load compressed data
        const compressedData = loadCompressedData();
        
        if (!compressedData.cards || compressedData.cards.length === 0) {
            throw new Error('No card data available. Please ensure sorceryCards.compressed.js is loaded.');
        }
        
        // Decompress all cards
        const rawCards = compressedData.cards.map(cardArray => 
            decompressCard(cardArray, compressedData.keys)
        );
        console.log(`Decompressed ${rawCards.length} raw cards`);
        
        // Transform cards
        const transformedCards = [];
        for (const rawCard of rawCards) {
            const card = transformCard(rawCard);
            if (card) {
                transformedCards.push(card);
            }
        }
        
        // Separate card types
        this.cards = transformedCards.filter(card => 
            card.type !== 'Avatar' && card.type !== 'Site'
        );
        this.avatars = transformedCards.filter(card => card.type === 'Avatar');
        this.sites = transformedCards.filter(card => card.type === 'Site');
        
        const endTime = Date.now();
        console.log(`Loaded ${this.cards.length} cards, ${this.avatars.length} avatars, ${this.sites.length} sites in ${endTime - startTime}ms`);
        
        this.loaded = true;
    }
    
    /**
     * Build a deck with given preferences
     */
    async buildDeck(preferences = {}) {
        await this.loadCardData();
        
        const deck = buildSmartDeck(this.cards, preferences);
        const stats = calculateDeckStats(deck);
        
        return {
            deck: deck,
            stats: stats,
            cardCount: this.cards.length,
            preferences: preferences
        };
    }
    
    /**
     * Get available avatars
     */
    async getAvatars() {
        await this.loadCardData();
        return this.avatars;
    }
    
    /**
     * Get available elements
     */
    getAvailableElements() {
        return ['Water', 'Fire', 'Earth', 'Air', 'Void'];
    }
    
    /**
     * Get available archetypes
     */
    getAvailableArchetypes() {
        return ['Aggro', 'Control', 'Midrange', 'Combo'];
    }
    
    /**
     * Search cards
     */
    async searchCards(query) {
        await this.loadCardData();
        const lowerQuery = query.toLowerCase();
        return this.cards.filter(card => 
            card.name.toLowerCase().includes(lowerQuery)
        ).slice(0, 20);
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.RealSorceryDeckBuilder = RealSorceryDeckBuilder;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealSorceryDeckBuilder;
}
