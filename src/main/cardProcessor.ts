import { Card, RawCard, Element, CardType, CardRarity } from '../types/Card';
import { parseThreshold } from '../utils/utils';

const utils = require('../utils/utils');

export interface ProcessedCardData {
    uniqueCards: Card[];
    avatars: Card[];
    sites: Card[];
    minions: Card[];
    artifacts: Card[];
    auras: Card[];
    magics: Card[];
    keywords: string[];
    elements: string[];
}

/**
 * Process and deduplicate card data
 */
export async function processCardData(dataSets: string[]): Promise<ProcessedCardData> {
    console.log("Loading card data...");
    
    // Get pre-processed card data from consolidated source
    const allCards: Card[] = await utils.readCardData(dataSets);

    if (allCards.length === 0) {
        throw new Error("No cards were loaded. Please check the card data.");
    }

    console.log("Processing card data...");

    // Group cards by their base name (to handle different versions of the same card)
    const cardsByName: { [name: string]: Card[] } = {};
    for (const card of allCards) {
        // Ensure baseName is derived if not present
        const baseName = card.baseName || utils.getBaseCardName(card.name);
        if (!cardsByName[baseName]) {
            cardsByName[baseName] = [];
        }
        cardsByName[baseName].push(card);
    }

    // For each group, keep the most desirable version of each card
    const uniqueCards: Card[] = [];
    for (const [name, versions] of Object.entries(cardsByName)) {
        // Sort by preferring non-preconstructed versions
        versions.sort((a, b) => {
            // Prioritize cards that are not from preconstructed decks
            const aIsPrecon = (a.cleanName || "").includes("Preconstructed");
            const bIsPrecon = (b.cleanName || "").includes("Preconstructed");
            if (aIsPrecon !== bIsPrecon) return aIsPrecon ? 1 : -1;

            // For cards with same precon status, maintain original order
            return 0;
        });

        // Add the best version to our unique cards list, transformed to Card
        uniqueCards.push(utils.transformRawCardToCard(versions[0]));
    }

    return categorizeCards(uniqueCards);
}

/**
 * Categorize cards by type and extract metadata
 */
function categorizeCards(uniqueCards: Card[]): ProcessedCardData {
    const avatars: Card[] = [];
    const sites: Card[] = [];
    const minions: Card[] = [];
    const artifacts: Card[] = [];
    const auras: Card[] = [];
    const magics: Card[] = [];

    // Sort cards by type
    for (const card of uniqueCards) {
        const cardTypeEnum = card.type;

        if (cardTypeEnum === CardType.Avatar) {
            avatars.push(card);
        } else if (cardTypeEnum === CardType.Site) {
            sites.push(card);
        } else if (cardTypeEnum === CardType.Minion) {
            minions.push(card);
        } else if (cardTypeEnum === CardType.Artifact) {
            artifacts.push(card);
        } else if (cardTypeEnum === CardType.Aura) {
            auras.push(card);
        } else if (cardTypeEnum === CardType.Magic) {
            magics.push(card);
        }
    }

    // Count keywords to identify synergies
    const keywords: string[] = [];
    for (const card of uniqueCards) {
        const text = card.text;
        if (text) {
            const foundKeywords = utils.extractKeywords(text);
            keywords.push(...foundKeywords);
        }
    }

    // Count elements to identify strongest element
    const elements: string[] = [];
    for (const card of uniqueCards) {
        const cardElements = card.elements;
        if (cardElements && cardElements.length > 0) {
            cardElements.forEach((element: Element) => elements.push(element.toString()));
        }
    }

    return {
        uniqueCards,
        avatars,
        sites,
        minions,
        artifacts,
        auras,
        magics,
        keywords,
        elements
    };
}

function toElementEnum(element: string): Element | undefined {
    switch (element) {
        case 'Water': return Element.Water;
        case 'Fire': return Element.Fire;
        case 'Earth': return Element.Earth;
        case 'Air': return Element.Air;
        case 'Void': return Element.Void;
        default: return undefined;
    }
}

// If Card type cannot be changed, add parsedThreshold for analysis
function transformRawCardToCard(raw: RawCard): Card & { parsedThreshold?: Record<string, number> } {
    return {
        ...raw,
        type: raw.extCardType as CardType,
        mana_cost: Number(raw.extCost) || 0,
        text: raw.extDescription || '',
        elements: raw.extElement ? [toElementEnum(raw.extElement)].filter(Boolean) as Element[] : [],
        power: Number(raw.extPowerRating) || 0,
        rarity: raw.extRarity as CardRarity,
        baseName: raw.cleanName || raw.name,
        cost: Number(raw.extCost) || 0,
        threshold: raw.extThreshold || '', // keep as string for Card compatibility
        parsedThreshold: raw.extThreshold ? parseThreshold(raw.extThreshold) : undefined
    };
}
