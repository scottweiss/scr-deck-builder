import { parse } from 'csv-parse/sync';
import { RawCard, Card, Element, CardRarity, ProcessedCard, CardSet, CardType } from '../types/Card'; // Added CardSet, CardType

export function getCardAttribute(card: RawCard | ProcessedCard | null | undefined, attributeName: string): string {
    if (!card) return "";
    const attrMap: Record<string, string> = {
        "CardType": "extCardType",
        "Cost": "extCost",
        "Description": "extDescription",
        "Element": "extElement",
        "Rarity": "extRarity"
    };
    const fieldName = attrMap[attributeName] || attributeName;
    return (card as any)[fieldName] || "";
}

export function getCardType(card: RawCard | ProcessedCard): CardType { // Return CardType enum
    const typeStr = getCardAttribute(card, "CardType");
    const typeKey = Object.keys(CardType).find(key => key.toLowerCase() === typeStr.toLowerCase());
    return typeKey ? CardType[typeKey as keyof typeof CardType] : CardType.Unknown;
}

export function getCardRarity(card: RawCard | ProcessedCard): CardRarity { // Return CardRarity enum
    const rarityStr = getCardAttribute(card, "Rarity");
    const rarityKey = Object.keys(CardRarity).find(key => key.toLowerCase() === rarityStr.toLowerCase());
    return rarityKey ? CardRarity[rarityKey as keyof typeof CardRarity] : CardRarity.Ordinary; // Default to Ordinary if not found
}

export function getCardCost(card: RawCard | ProcessedCard): number {
    const costStr = getCardAttribute(card, "Cost");
    if (costStr === "X") return 0;
    const cost = parseInt(costStr);
    return isNaN(cost) ? 0 : cost;
}

export function getCardDescription(card: RawCard | ProcessedCard): string {
    return getCardAttribute(card, "Description");
}

export function getCardElements(card: RawCard | ProcessedCard): Element[] {
    if ((card as any).elements && Array.isArray((card as any).elements)) {
        return (card as any).elements; // Already ProcessedCard
    }
    const rawCard = card as RawCard;
    if (rawCard.extElement) {
        const elementStrings = rawCard.extElement.split(',').map(e => e.trim());
        return elementStrings.map(elStr => {
            const elKey = Object.keys(Element).find(key => key.toLowerCase() === elStr.toLowerCase());
            return elKey ? Element[elKey as keyof typeof Element] : undefined;
        }).filter(el => el !== undefined) as Element[];
    }
    return [];
}

export function getCardPower(card: RawCard | ProcessedCard): number {
    if ((card as any).power !== undefined) {
        return (card as any).power; // Already ProcessedCard
    }
    const rawCard = card as RawCard;
    if (rawCard.extPowerRating) {
        const power = parseInt(rawCard.extPowerRating);
        return isNaN(power) ? 0 : power;
    }
    return 0;
}

export function getBaseCardName(name: string): string {
    if (!name) return "";
    return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function countOccurrences<T extends string | number>(arr: T[]): Record<T, number> {
    return arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {} as Record<T, number>);
}

export function getMostCommon<T extends string | number>(counter: Record<T, number>, n: number = 1): Array<[T, number]> {
    return Object.entries(counter)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, n) as Array<[T, number]>;
}

export function extractKeywords(text: string): string[] {
    if (!text) return [];
    const keywordRegex = /\b(Airborne|Burrowing|Charge|Deathrite|Spellcaster|Stealth|Submerge|Voidwalk|Movement \+\d+|Ranged \d+|Lethal|Lance|Waterbound)\b/g;
    const matches = text.match(keywordRegex);
    return matches || [];
}

export async function readCardData(dataSets?: string[]): Promise<Card[]> { // Fixed return type to Card[]
    // Require here to avoid circular dependency at module load
    const sorceryCards = require('../data/processed/sorceryCards');
    
    let cards: Card[] = [];
    if (dataSets && Array.isArray(dataSets)) {
        if (dataSets.length < 2) {
            // If specific set was requested, get all cards and filter them
            // This ensures consistent transformation
            const allCards = await sorceryCards.getAllCards(); // Already returns transformed Card[]
            const setName = dataSets[0];
            cards = allCards.filter((card: Card) => card.setName === setName);
            console.log(`Using only ${setName} set cards: ${cards.length} cards`);
        } else {
            cards = await sorceryCards.getAllCards(); // Already returns transformed Card[]
            console.log(`Using consolidated card data: ${cards.length} cards from ${dataSets.join(', ')}`);
        }
    } else {
        cards = await sorceryCards.getAllCards(); // Already returns transformed Card[]
        console.log(`Using all consolidated card data: ${cards.length} cards`);
    }
    
    // Cards are already properly transformed with all computed properties
    return cards;
}

export function parseThreshold(thresholdStr: string): Record<string, number> {
    if (!thresholdStr) return {};
    
    const thresholdMap: Record<string, number> = {};
    
    // Count occurrences of each element letter in the threshold string
    // The format is like "WW" for 2 Water, "AA" for 2 Air, "F" for 1 Fire, etc.
    for (const char of thresholdStr.toUpperCase()) {
        let elementName: string;
        switch (char) {
            case 'W':
                elementName = 'Water';
                break;
            case 'F':
                elementName = 'Fire';
                break;
            case 'E':
                elementName = 'Earth';
                break;
            case 'A':
                elementName = 'Air';
                break;
            case 'V':
                elementName = 'Void';
                break;
            default:
                continue; // Skip non-element characters
        }
        
        thresholdMap[elementName] = (thresholdMap[elementName] || 0) + 1;
    }
    
    return thresholdMap;
}

/**
 * Parse elemental affinity from sites (what they provide)
 * Sites provide affinity through their elemental symbols
 */
export function parseElementalAffinity(card: RawCard | Card): Record<string, number> {
    const affinity: Record<string, number> = {};
    const elements = getCardElements(card);
    
    // Each element symbol on a site provides 1 affinity of that element
    for (const element of elements) {
        const elementName = element.toString();
        affinity[elementName] = (affinity[elementName] || 0) + 1;
    }
    
    return affinity;
}

/**
 * Parse threshold requirements from spells (what they need)
 * Spells require threshold to be cast
 */
export function parseThresholdRequirements(card: RawCard | Card): Record<string, number> {
    let thresholdStr = '';
    if ((card as any).threshold) {
        thresholdStr = (card as any).threshold;
    } else if ((card as RawCard).extThreshold) {
        thresholdStr = (card as RawCard).extThreshold;
    }
    
    return parseThreshold(thresholdStr);
}

/**
 * Get mana generation for sites (how much mana they provide)
 */
export function getManaGeneration(card: RawCard | Card): number {
    const cardType = (card as Card).type || (card as RawCard).extCardType;
    if (cardType === 'Site') {
        // Sites typically generate 1 mana, but could be specified differently
        // For now, assume 1 mana per site (this could be enhanced with actual data)
        return 1;
    }
    return 0;
}

export function getCardThreshold(card: RawCard | ProcessedCard | Card): Record<string, number> {
    // For new Card structure with proper parsing
    if ((card as Card).thresholdRequirements) {
        return (card as Card).thresholdRequirements!;
    }
    
    // If it's already a Card with parsed threshold somewhere, check for it
    if ((card as any).parsedThreshold) {
        return (card as any).parsedThreshold;
    }
    
    // Get threshold string from various possible sources for backward compatibility
    let thresholdStr = '';
    if ((card as any).threshold) {
        thresholdStr = (card as any).threshold;
    } else if ((card as RawCard).extThreshold) {
        thresholdStr = (card as RawCard).extThreshold;
    }
    
    return parseThreshold(thresholdStr);
}

/**
 * Get elemental affinity provided by a site
 */
export function getCardElementalAffinity(card: Card): Record<string, number> {
    if (card.elementalAffinity) {
        return card.elementalAffinity;
    }
    
    // Fallback for cards not yet properly processed
    if (card.type === CardType.Site) {
        return parseElementalAffinity(card);
    }
    
    return {};
}

/**
 * Get mana generation provided by a site
 */
export function getCardManaGeneration(card: Card): number {
    if (card.manaGeneration !== undefined) {
        return card.manaGeneration;
    }
    
    // Fallback for cards not yet properly processed
    return getManaGeneration(card);
}

export function transformRawCardToCard(rawCard: RawCard): Card {
    const manaCost = getCardCost(rawCard);
    const cardType = getCardType(rawCard);
    const elements = getCardElements(rawCard);
    const power = getCardPower(rawCard);
    const rarity = getCardRarity(rawCard);
    const text = getCardDescription(rawCard);
    const baseName = getBaseCardName(rawCard.name);

    let life: number | undefined = undefined;
    if (rawCard.extLife) {
        const parsedLife = parseInt(rawCard.extLife, 10);
        if (!isNaN(parsedLife)) life = parsedLife;
    }

    let defense: number | undefined = undefined;
    if (rawCard.extDefensePower) {
        const parsedDefense = parseInt(rawCard.extDefensePower, 10);
        if (!isNaN(parsedDefense)) defense = parsedDefense;
    }

    // Parse different data based on card type
    let thresholdRequirements: Record<string, number> | undefined = undefined;
    let elementalAffinity: Record<string, number> | undefined = undefined;
    let manaGeneration: number | undefined = undefined;

    if (cardType === CardType.Site) {
        // Sites provide elemental affinity and mana generation
        elementalAffinity = parseElementalAffinity(rawCard);
        manaGeneration = getManaGeneration(rawCard);
    } else {
        // Spells (Minions, Magic, Artifacts, Auras) have threshold requirements
        thresholdRequirements = parseThresholdRequirements(rawCard);
    }

    const card: Card = {
        ...rawCard, // Spread all RawCard properties first
        type: cardType,
        mana_cost: manaCost,
        cost: manaCost, // Assigning parsed cost to both fields
        text: text,
        elements: elements,
        power: power,
        rarity: rarity,
        baseName: baseName,
        life: life,
        defense: defense,
        threshold: rawCard.extThreshold || '', // Keep as string
        subtype: rawCard.extCardSubtype || undefined,
        thresholdRequirements: thresholdRequirements,
        elementalAffinity: elementalAffinity,
        manaGeneration: manaGeneration,
    };
    return card;
}

/**
 * Remove all cards whose name includes 'Rubble' (case-insensitive) from a card array
 */
export function filterOutRubble<T extends { name?: string }>(cards: T[]): T[] {
    return cards.filter(card => !((card.name || '').toLowerCase().includes('rubble')));
}
