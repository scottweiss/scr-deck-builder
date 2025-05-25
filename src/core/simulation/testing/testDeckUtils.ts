import { Card, Element, CardType } from '../../../types/Card';
import { PlayerDeck } from '../../../types/Deck';

/**
 * Converts a Card array to PlayerDeck format (Sorcery rules)
 */
export function convertToPlayerDeck(cards: Card[]): PlayerDeck {
    // Find avatar (CardType.Avatar)
    const avatarCard = cards.find(c => c.type === CardType.Avatar) || createMockAvatar();
    // All other cards (excluding avatar)
    const nonAvatarCards = cards.filter(c => c !== avatarCard);
    // Ensure minimum deck requirements
    const spells = nonAvatarCards.filter(c => [CardType.Minion, CardType.Magic, CardType.Artifact, CardType.Aura].includes(c.type as CardType));
    const sites = nonAvatarCards.filter(c => c.type === CardType.Site);
    while (spells.length < 50) {
        spells.push(createMockSpell());
    }
    while (sites.length < 30) {
        sites.push(createMockSite());
    }
    // PlayerDeck: avatar is string (productId), cards is flat array
    return {
        avatar: avatarCard.productId || avatarCard.name,
        cards: [avatarCard, ...spells, ...sites]
    };
}

/**
 * Creates a mock avatar for testing (Sorcery type)
 */
export function createMockAvatar(): Card {
    return {
        productId: 'mock_avatar',
        id: 'mock_avatar',
        name: 'Test Avatar',
        type: CardType.Avatar,
        cost: 0,
        mana_cost: 0,
        text: 'Test avatar with 20 life',
        elements: [],
        power: 0,
        rarity: 'Unique',
        baseName: 'Test Avatar',
        imageUrl: '',
        categoryId: 'avatar',
        groupId: 'test',
        url: '',
        modifiedOn: '',
        effect: 'Test avatar with 20 life',
        keywords: [],
        subtypes: []
    } as Card;
}

/**
 * Creates a mock spell for testing (Sorcery type)
 */
export function createMockSpell(): Card {
    return {
        productId: 'mock_spell',
        id: 'mock_spell',
        name: 'Test Spell',
        type: CardType.Magic,
        cost: 1,
        mana_cost: 1,
        text: 'Test spell',
        elements: [],
        power: 0,
        rarity: 'Ordinary',
        baseName: 'Test Spell',
        imageUrl: '',
        categoryId: 'magic',
        groupId: 'test',
        url: '',
        modifiedOn: '',
        effect: 'Test spell',
        keywords: [],
        subtypes: []
    } as Card;
}

/**
 * Creates a mock site for testing (Sorcery type)
 */
export function createMockSite(): Card {
    return {
        productId: 'mock_site',
        id: 'mock_site',
        name: 'Test Site',
        type: CardType.Site,
        cost: 0,
        mana_cost: 0,
        text: 'Test site',
        elements: [],
        power: 0,
        rarity: 'Ordinary',
        baseName: 'Test Site',
        imageUrl: '',
        categoryId: 'site',
        groupId: 'test',
        url: '',
        modifiedOn: '',
        effect: 'Test site',
        keywords: [],
        subtypes: []
    } as Card;
}

/**
 * Create a baseline deck for testing (Sorcery types)
 */
export function createBaselineDeck(): Card[] {
    // 1 avatar, 50 spells (minions/magics), 30 sites
    const avatar = { ...createMockAvatar(), id: 'baseline_avatar', productId: 'baseline_avatar' };
    const spells = Array(50).fill(null).map((_, i) => ({
        ...createMockSpell(),
        id: `baseline_spell_${i}`,
        productId: `baseline_spell_${i}`,
        name: `Baseline Spell ${i}`,
        type: i % 2 === 0 ? CardType.Minion : CardType.Magic
    } as Card));
    const sites = Array(30).fill(null).map((_, i) => ({
        ...createMockSite(),
        id: `baseline_site_${i}`,
        productId: `baseline_site_${i}`,
        name: `Baseline Site ${i}`
    } as Card));
    return [avatar, ...spells, ...sites];
}

/**
 * Create a test deck for a specific element and archetype (Sorcery types)
 */
export function createTestDeck(element: string, archetype: string): Card[] {
    // 1 avatar, 50 spells, 30 sites
    const elementEnum = (Element[element.charAt(0).toUpperCase() + element.slice(1).toLowerCase() as keyof typeof Element]) || Element.Fire;
    const avatar = { ...createMockAvatar(), id: `${element}_${archetype}_avatar`, productId: `${element}_${archetype}_avatar`, name: `${element} ${archetype} Avatar`, elements: [elementEnum] } as Card;
    const spells = Array(50).fill(null).map((_, i) => ({
        ...createMockSpell(),
        id: `${element}_${archetype}_spell_${i}`,
        productId: `${element}_${archetype}_spell_${i}`,
        name: `${element} ${archetype} Spell ${i}`,
        type: i % 2 === 0 ? CardType.Minion : CardType.Magic,
        elements: [elementEnum]
    } as Card));
    const sites = Array(30).fill(null).map((_, i) => ({
        ...createMockSite(),
        id: `${element}_${archetype}_site_${i}`,
        productId: `${element}_${archetype}_site_${i}`,
        name: `${element} ${archetype} Site ${i}`,
        elements: [elementEnum]
    } as Card));
    return [avatar, ...spells, ...sites];
}

/**
 * Get a set of representative meta decks for testing (Sorcery types)
 */
export function getMetaDecks(): { name: string; cards: Card[] }[] {
    return [
        { name: 'Aggro Fire', cards: createTestDeck('Fire', 'Aggro') },
        { name: 'Control Water', cards: createTestDeck('Water', 'Control') },
        { name: 'Midrange Earth', cards: createTestDeck('Earth', 'Midrange') },
        { name: 'Combo Air', cards: createTestDeck('Air', 'Combo') }
    ];
}
