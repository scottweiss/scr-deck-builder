import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { SORCERY_CARDS, getAllCards } from '../data/processed/sorceryCards';
import { 
    RawCard, 
    Card, 
    Element, 
    CardType, 
    CardRarity,
    ProcessedCard 
} from '../types/Card';

/**
 * Mapping of attribute names to field names in the card data
 */
const ATTRIBUTE_MAP: Record<string, string> = {
    "CardType": "extCardType",
    "Cost": "extCost",
    "Description": "extDescription",
    "Element": "extElement",
    "Rarity": "extRarity"
};

/**
 * Element keywords for automatic element detection
 */
const ELEMENT_KEYWORDS: {[key in Element]: string[]} = {
    [Element.Water]: ["water", "aqua", "sea", "ocean", "river", "lake", "flood", "tide", "wave"],
    [Element.Fire]: ["fire", "flame", "burn", "ember", "blaze", "inferno", "scorch", "heat"],
    [Element.Earth]: ["earth", "stone", "rock", "mountain", "quake", "terrain", "ground"],
    [Element.Air]: ["air", "wind", "sky", "storm", "breeze", "gust", "tornado", "cloud"],
    [Element.Void]: ["void", "abyss", "darkness", "shadow", "ethereal", "astral", "cosmic"]
};

/**
 * Extract attribute from card data
 */
export function getCardAttribute(card: RawCard | null | undefined, attributeName: string): string {
    if (!card) {
        return "";
    }

    const fieldName = ATTRIBUTE_MAP[attributeName] || attributeName;
    return (card as any)[fieldName] || "";
}

/**
 * Extract card type from data
 */
export function getCardType(card: RawCard): CardType {
    const typeStr = getCardAttribute(card, "CardType");
    // Convert string to CardType enum, defaulting to Unknown if not found
    return Object.values(CardType).includes(typeStr as CardType) 
        ? typeStr as CardType 
        : CardType.Unknown;
}

/**
 * Extract rarity from card data
 */
export function getCardRarity(card: RawCard): CardRarity {
    const rarityStr = getCardAttribute(card, "Rarity");
    // Convert string to CardRarity enum, defaulting to Common if not found
    return Object.values(CardRarity).includes(rarityStr as CardRarity) 
        ? rarityStr as CardRarity 
        : CardRarity.Common;
}

/**
 * Extract mana cost from data
 */
export function getCardCost(card: RawCard): number {
    const costStr = getCardAttribute(card, "Cost");
    if (costStr === "X") return 0; // Handle X cost
    const cost = parseInt(costStr);
    return isNaN(cost) ? 0 : cost;
}

/**
 * Extract card description from data
 */
export function getCardDescription(card: RawCard): string {
    return getCardAttribute(card, "Description");
}

/**
 * Extract elements from card data
 */
export function getCardElements(card: RawCard): Element[] {
    const elements: Element[] = [];

    // Check extElement field
    const elementStr = card.extElement || "";
    if (elementStr) {
        // Handle multiple elements separated by semicolons if present
        const elementList = elementStr.split(';').map(e => e.trim());
        elementList.forEach(e => {
            const normalizedElement = e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() as Element;
            if (Object.values(Element).includes(normalizedElement)) {
                elements.push(normalizedElement);
            }
        });
    }

    // If no elements found, try to parse from other attributes
    if (elements.length === 0) {
        const name = (card.name || "").toLowerCase();
        const description = getCardDescription(card).toLowerCase();
        const combinedText = name + " " + description;

        // Check for element keywords
        for (const [element, keywords] of Object.entries(ELEMENT_KEYWORDS)) {
            for (const keyword of keywords) {
                if (combinedText.includes(keyword)) {
                    elements.push(element as Element);
                    break;
                }
            }
        }
    }

    // Remove duplicates and return
    return [...new Set(elements)];
}

/**
 * Extract power from card data
 */
export function getCardPower(card: RawCard): number {
    // First try powerRating
    const powerStr = card.extPowerRating || "";
    if (powerStr) {
        const power = parseInt(powerStr);
        if (!isNaN(power)) {
            return power;
        }
    }

    // Then try defensePower
    const defenseStr = card.extDefensePower || "";
    if (defenseStr) {
        const defense = parseInt(defenseStr);
        if (!isNaN(defense)) {
            return defense;
        }
    }

    // Try to extract power from description using regex
    const description = getCardDescription(card);
    const powerMatch = description.match(/Power\s*:?\s*(\d+)/);
    if (powerMatch) {
        return parseInt(powerMatch[1]);
    }

    // Default power based on card type
    const cardType = getCardType(card);
    if (cardType === CardType.Minion) {
        return 2;  // Default power for minions
    }
    return 0;
}

/**
 * Get the base name of a card, removing set-specific suffixes like "(Foil)" or "(Preconstructed Deck)"
 */
export function getBaseCardName(name: string): string {
    if (!name) return "";

    // Remove common suffixes
    return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * Count occurrences in an array (similar to Python's Counter)
 */
export function countOccurrences<T extends string | number>(arr: T[]): Record<T, number> {
    return arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {} as Record<T, number>);
}

/**
 * Get the n most common items from a counter object
 */
export function getMostCommon<T extends string | number>(
    counter: Record<T, number>, 
    n: number = 1
): Array<[T, number]> {
    return Object.entries(counter)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, n) as Array<[T, number]>;
}

/**
 * Extract keywords from card text
 */
export function extractKeywords(text: string): string[] {
    if (!text) return [];

    const keywordRegex = /\b(Airborne|Burrowing|Charge|Deathrite|Spellcaster|Stealth|Submerge|Voidwalk|Movement \+\d+|Ranged \d+|Lethal|Lance|Waterbound)\b/g;
    const matches = text.match(keywordRegex);
    return matches || [];
}

/**
 * Read and process card data from consolidated data source
 */
export function readCardData(dataSets?: string[]): ProcessedCard[] {
    // Use the pre-loaded consolidated data based on requested data sets
    if (dataSets && Array.isArray(dataSets)) {
        // Filter cards by requested sets
        let filteredCards = [...SORCERY_CARDS];
        
        if (dataSets.length < 2) {
            // If specific set was requested, filter the cards
            const setName = dataSets[0];
            filteredCards = filteredCards.filter(card => card.setName === setName);
            console.log(`Using only ${setName} set cards: ${filteredCards.length} cards`);
        } else {
            console.log(`Using consolidated card data: ${filteredCards.length} cards from ${dataSets.join(', ')}`);
        }
        
        // Add processed attributes to each card for easy access
        const processedCards: ProcessedCard[] = filteredCards.map(card => ({
            ...card,
            type: getCardType(card),
            mana_cost: getCardCost(card),
            text: getCardDescription(card),
            elements: getCardElements(card),
            power: getCardPower(card),
            rarity: getCardRarity(card),
            baseName: getBaseCardName(card.name || '')
        }));
        
        return processedCards;
    }
    
    // If no specific sets were requested, return all cards
    console.log(`Using all consolidated card data: ${SORCERY_CARDS.length} cards`);
    const processedCards: ProcessedCard[] = SORCERY_CARDS.map(card => ({
        ...card,
        type: getCardType(card),
        mana_cost: getCardCost(card),
        text: getCardDescription(card),
        elements: getCardElements(card),
        power: getCardPower(card),
        rarity: getCardRarity(card),
        baseName: getBaseCardName(card.name || '')
    }));
    
    return processedCards;
}

/**
 * Get high value cards sorted by market price
 */
export function getHighValueCards(cards: ProcessedCard[], limit: number = 10): ProcessedCard[] {
    return [...cards]
        .filter(card => parseFloat(card.marketPrice || '0') > 0)
        .sort((a, b) => parseFloat(b.marketPrice || '0') - parseFloat(a.marketPrice || '0'))
        .slice(0, limit);
}
