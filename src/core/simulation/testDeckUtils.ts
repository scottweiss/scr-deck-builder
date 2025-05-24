import { Card } from './gameState';
import { Element, CardType } from '../../types/Card';
import { PlayerDeck } from './matchSimulator';

/**
 * Converts a Card array to PlayerDeck format
 */
export function convertToPlayerDeck(cards: Card[]): PlayerDeck {
    // Separate cards by type
    const avatar = cards.find(c => c.type === CardType.Avatar) || createMockAvatar();
    const spells = cards.filter(c => c.type === CardType.Minion || c.type === CardType.Magic || 
                                    c.type === CardType.Artifact || c.type === CardType.Aura);
    const sites = cards.filter(c => c.type === CardType.Site);
    
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
        productId: 'mock_avatar',
        name: 'Test Avatar',
        cleanName: 'test_avatar',
        imageUrl: '',
        categoryId: '',
        groupId: '',
        url: '',
        modifiedOn: '',
        imageCount: '',
        extRarity: 'Unique',
        extDescription: '',
        extCost: '0',
        extThreshold: '',
        extElement: 'Fire',
        extTypeLine: 'Avatar',
        extCardCategory: 'Avatar',
        extCardType: 'Avatar',
        subTypeName: '',
        extPowerRating: '0',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '20',
        setName: 'Test',
        type: CardType.Avatar,
        mana_cost: 0,
        text: 'Test avatar',
        elements: [Element.Fire],
        power: 0,
        life: 20,
        rarity: 'Unique' as any,
        baseName: 'Test Avatar',
        cost: 0,
        threshold: '',
        subtype: ''
    };
}

/**
 * Creates a mock spell for testing
 */
export function createMockSpell(): Card {
    return {
        productId: 'mock_spell',
        name: 'Test Spell',
        cleanName: 'test_spell',
        imageUrl: '',
        categoryId: '',
        groupId: '',
        url: '',
        modifiedOn: '',
        imageCount: '',
        extRarity: 'Common',
        extDescription: '',
        extCost: '1',
        extThreshold: '',
        extElement: 'Fire',
        extTypeLine: 'Magic',
        extCardCategory: 'Magic',
        extCardType: 'Magic',
        subTypeName: '',
        extPowerRating: '0',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '',
        setName: 'Test',
        type: CardType.Magic,
        mana_cost: 1,
        text: 'Test spell',
        elements: [Element.Fire],
        power: 0,
        rarity: 'Common' as any,
        baseName: 'Test Spell',
        cost: 1,
        threshold: '',
        subtype: ''
    };
}

/**
 * Creates a mock site for testing
 */
export function createMockSite(): Card {
    return {
        productId: 'mock_site',
        name: 'Test Site',
        cleanName: 'test_site',
        imageUrl: '',
        categoryId: '',
        groupId: '',
        url: '',
        modifiedOn: '',
        imageCount: '',
        extRarity: 'Common',
        extDescription: '',
        extCost: '0',
        extThreshold: '',
        extElement: 'Fire',
        extTypeLine: 'Site',
        extCardCategory: 'Site',
        extCardType: 'Site',
        subTypeName: '',
        extPowerRating: '0',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '',
        setName: 'Test',
        type: CardType.Site,
        mana_cost: 0,
        text: 'Test site',
        elements: [Element.Fire],
        power: 0,
        rarity: 'Common' as any,
        baseName: 'Test Site',
        cost: 0,
        threshold: '',
        subtype: ''
    };
}

/**
 * Create a baseline deck for testing
 */
export function createBaselineDeck(): Card[] {
    // Create a balanced baseline deck for testing
    return Array(40).fill(null).map((_, i) => ({
        productId: `baseline_${i}`,
        name: `Baseline Card ${i}`,
        cleanName: `baseline_card_${i}`,
        imageUrl: '',
        categoryId: '',
        groupId: '',
        url: '',
        modifiedOn: '',
        imageCount: '',
        extRarity: 'Common',
        extDescription: '',
        extCost: (Math.floor(i / 8) + 1).toString(),
        extThreshold: '',
        extElement: 'Air',
        extTypeLine: i % 3 === 0 ? 'Minion' : i % 3 === 1 ? 'Magic' : 'Site',
        extCardCategory: i % 3 === 0 ? 'Minion' : i % 3 === 1 ? 'Magic' : 'Site',
        extCardType: i % 3 === 0 ? 'Minion' : i % 3 === 1 ? 'Magic' : 'Site',
        subTypeName: '',
        extPowerRating: i % 3 === 0 ? (Math.floor(i / 10) + 1).toString() : '0',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: i % 3 === 0 ? (Math.floor(i / 10) + 1).toString() : '',
        setName: 'Test',
        type: i % 3 === 0 ? CardType.Minion : i % 3 === 1 ? CardType.Magic : CardType.Site,
        mana_cost: Math.floor(i / 8) + 1,
        text: 'Baseline test card',
        elements: [Element.Air],
        power: i % 3 === 0 ? Math.floor(i / 10) + 1 : 0,
        life: i % 3 === 0 ? Math.floor(i / 10) + 1 : undefined,
        rarity: 'Common' as any,
        baseName: `Baseline Card ${i}`,
        cost: Math.floor(i / 8) + 1,
        threshold: '',
        subtype: ''
    }));
}

/**
 * Create a test deck for a specific element and archetype
 */
export function createTestDeck(element: string, archetype: string): Card[] {
    // Create test decks for different archetypes
    const baseCost = archetype === 'aggro' ? 2 : archetype === 'control' ? 5 : 3;
    const elementEnum = element === 'fire' ? Element.Fire : 
                      element === 'water' ? Element.Water :
                      element === 'earth' ? Element.Earth :
                      element === 'air' ? Element.Air : Element.Air;
    
    return Array(40).fill(null).map((_, i) => ({
        productId: `${element}_${archetype}_${i}`,
        name: `${element} ${archetype} Card ${i}`,
        cleanName: `${element}_${archetype}_card_${i}`,
        imageUrl: '',
        categoryId: '',
        groupId: '',
        url: '',
        modifiedOn: '',
        imageCount: '',
        extRarity: 'Common',
        extDescription: '',
        extCost: (baseCost + Math.floor(i / 10)).toString(),
        extThreshold: '',
        extElement: element,
        extTypeLine: i % 3 === 0 ? 'Minion' : i % 3 === 1 ? 'Magic' : 'Site',
        extCardCategory: i % 3 === 0 ? 'Minion' : i % 3 === 1 ? 'Magic' : 'Site',
        extCardType: i % 3 === 0 ? 'Minion' : i % 3 === 1 ? 'Magic' : 'Site',
        subTypeName: '',
        extPowerRating: i % 3 === 0 ? (baseCost + Math.floor(i / 15)).toString() : '0',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: i % 3 === 0 ? (baseCost + Math.floor(i / 15)).toString() : '',
        setName: 'Test',
        type: i % 3 === 0 ? CardType.Minion : i % 3 === 1 ? CardType.Magic : CardType.Site,
        mana_cost: baseCost + Math.floor(i / 10),
        text: `${archetype} ${element} card`,
        elements: [elementEnum],
        power: i % 3 === 0 ? baseCost + Math.floor(i / 15) : 0,
        life: i % 3 === 0 ? baseCost + Math.floor(i / 15) : undefined,
        rarity: 'Common' as any,
        baseName: `${element} ${archetype} Card ${i}`,
        cost: baseCost + Math.floor(i / 10),
        threshold: '',
        subtype: ''
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
