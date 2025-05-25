import { Card } from '../core/gameState';
import { Element, CardType } from '../../../types/Card';
import { PlayerDeck } from '../core/matchSimulator';

/**
 * Converts a Card array to PlayerDeck format
 */
export function convertToPlayerDeck(cards: Card[]): PlayerDeck {
    // Separate cards by type
    const avatar = cards.find(c => c.type === 'Avatar') || createMockAvatar();
    const spells = cards.filter(c => c.type === 'Creature' || c.type === 'Instant' || c.type === 'Sorcery' || 
                                    c.type === 'Artifact' || c.type === 'Enchantment');
    const sites = cards.filter(c => c.type === 'Site');
    
    // Ensure minimum deck requirements
    while (spells.length < 50) {
        spells.push(createMockSpell());
    }
    while (sites.length < 30) {
        sites.push(createMockSite());
    }
    
    return { avatar, spells, sites };
}

/**
 * Creates a mock avatar for testing
 */
export function createMockAvatar(): Card {
    return {
        id: 'mock_avatar',
        name: 'Test Avatar',
        type: 'Avatar',
        cost: 0,
        keywords: [],
        subtypes: [],
        effect: 'Test avatar with 20 life'
    };
}

/**
 * Creates a mock spell for testing
 */
export function createMockSpell(): Card {
    return {
        id: 'mock_spell',
        name: 'Test Spell',
        type: 'Instant',
        cost: 1,
        effect: 'Test spell',
        keywords: [],
        subtypes: []
    };
}

/**
 * Creates a mock site for testing
 */
export function createMockSite(): Card {
    return {
        id: 'mock_site',
        name: 'Test Site',
        type: 'Site',
        cost: 0,
        effect: 'Test site',
        keywords: [],
        subtypes: []
    };
}

/**
 * Create a baseline deck for testing
 */
export function createBaselineDeck(): Card[] {
    // Create a balanced baseline deck for testing
    return Array(40).fill(null).map((_, i) => ({
        id: `baseline_${i}`,
        name: `Baseline Card ${i}`,
        type: i % 3 === 0 ? 'Creature' : i % 3 === 1 ? 'Instant' : 'Site',
        cost: Math.floor(i / 8) + 1,
        effect: 'Baseline test card',
        keywords: [],
        subtypes: []
    }));
}

/**
 * Create a test deck for a specific element and archetype
 */
export function createTestDeck(element: string, archetype: string): Card[] {
    // Create test decks for different archetypes
    const baseCost = archetype === 'aggro' ? 2 : archetype === 'control' ? 5 : 3;
    
    return Array(40).fill(null).map((_, i) => ({
        id: `${element}_${archetype}_${i}`,
        name: `${element} ${archetype} Card ${i}`,
        type: i % 3 === 0 ? 'Creature' : i % 3 === 1 ? 'Instant' : 'Site',
        cost: baseCost + Math.floor(i / 10),
        effect: `${archetype} ${element} card`,
        keywords: [],
        subtypes: []
    }));
}

/**
 * Get a set of representative meta decks for testing
 */
export function getMetaDecks(): { name: string; cards: Card[] }[] {
    // Return a set of representative meta decks
    return [
        { name: 'Aggro Fire', cards: createTestDeck('fire', 'aggro') },
        { name: 'Control Water', cards: createTestDeck('water', 'control') },
        { name: 'Midrange Earth', cards: createTestDeck('earth', 'midrange') },
        { name: 'Combo Air', cards: createTestDeck('air', 'combo') }
    ];
}
