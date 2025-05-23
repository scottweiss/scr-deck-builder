import { parse } from 'csv-parse/sync';
import { RawCard, Card, Element, CardRarity, ProcessedCard, CardSet, CardType } from '../types/Card'; // Added CardSet, CardType
import * as sorceryCardsOptimized from './sorceryCards.optimized'; // Changed import

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

export async function readCardData(dataSets?: string[]): Promise<RawCard[]> { // Made async, returns Promise<RawCard[]>
    console.log('Using optimized card data loading...');
    const startTime = performance.now();
    let filteredCards: RawCard[] = [];

    if (dataSets && Array.isArray(dataSets)) {
        if (dataSets.length < 2) {
            const setName = dataSets[0] as CardSet;
            try {
                filteredCards = await sorceryCardsOptimized.getCardsBySet(setName);
                console.log(`Using only ${setName} set cards: ${filteredCards.length} cards`);
            } catch (error) {
                console.error(`Error loading cards for set ${setName}:`, error);
            }
        } else {
            try {
                filteredCards = await sorceryCardsOptimized.getAllCards();
                console.log(`Using all card sets: ${filteredCards.length} cards from ${dataSets.join(', ')}`);
            } catch (error) {
                console.error('Error loading all cards:', error);
            }
        }
    } else {
        console.log(`Using all consolidated card data`);
        try {
            filteredCards = await sorceryCardsOptimized.getAllCards();
        } catch (error) {
            console.error('Error loading all cards:', error);
        }
    }

    const endTime = performance.now();
    // Moved logging of load time to be more general
    if (filteredCards.length > 0) {
      console.log(`Loaded ${filteredCards.length} cards in ${((endTime - startTime) / 1000).toFixed(3)}s`);
    } else {
      console.log(`Card data loading attempt finished in ${((endTime - startTime) / 1000).toFixed(3)}s, but no cards were loaded.`);
    }
    // Removed the warning about returning potentially empty list as it should now be properly awaited.
    return filteredCards;
}

export function getHighValueCards(cards: RawCard[], limit: number = 10): RawCard[] { // Parameter type RawCard[]
    return [...cards]
        .filter(card => parseFloat(card.marketPrice || '0') > 0)
        .sort((a, b) => parseFloat(b.marketPrice || '0') - parseFloat(a.marketPrice || '0'))
        .slice(0, limit);
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
        threshold: rawCard.extThreshold || undefined,
        subtype: rawCard.extCardSubtype || undefined,
    };
    return card;
}
