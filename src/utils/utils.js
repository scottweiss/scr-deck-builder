const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Helper functions to extract card data from the consolidated dataset
function getCardAttribute(card, attributeName) {
    /**
     * Extract attribute from card data
     */
    if (!card) {
        return "";
    }

    const attrMap = {
        "CardType": "extCardType",
        "Cost": "extCost",
        "Description": "extDescription",
        "Element": "extElement",
        "Rarity": "extRarity"
    };

    const fieldName = attrMap[attributeName] || attributeName;
    return card[fieldName] || "";
}

function getCardType(card) {
    /**
     * Extract card type from data
     */
    return getCardAttribute(card, "CardType");
}

function getCardRarity(card) {
    /**
     * Extract rarity from card data
     */
    return getCardAttribute(card, "Rarity");
}

function getCardCost(card) {
    /**
     * Extract mana cost from data
     */
    const costStr = getCardAttribute(card, "Cost");
    if (costStr === "X") return 0; // Handle X cost
    const cost = parseInt(costStr);
    return isNaN(cost) ? 0 : cost;
}

function getCardDescription(card) {
    /**
     * Extract card description from data
     */
    return getCardAttribute(card, "Description");
}

function getCardElements(card) {
    /**
     * Extract elements from card data
     */
    const elements = [];

    // Check extElement field
    const elementStr = card.extElement || "";
    if (elementStr) {
        // Handle multiple elements separated by semicolons if present
        const elementList = elementStr.split(';').map(e => e.trim());
        elements.push(...elementList.map(e => e.charAt(0).toUpperCase() + e.slice(1).toLowerCase()));
    }

    // If no elements found, try to parse from other attributes
    if (elements.length === 0) {
        const name = (card.name || "").toLowerCase();
        const description = getCardDescription(card).toLowerCase();
        const combinedText = name + " " + description;

        // Element keywords to look for
        const elementKeywords = {
            "water": ["water", "aqua", "sea", "ocean", "river", "lake", "flood", "tide", "wave"],
            "fire": ["fire", "flame", "burn", "ember", "blaze", "inferno", "scorch", "heat"],
            "earth": ["earth", "stone", "rock", "mountain", "quake", "terrain", "ground"],
            "air": ["air", "wind", "sky", "storm", "breeze", "gust", "tornado", "cloud"],
            "void": ["void", "abyss", "darkness", "shadow", "ethereal", "astral", "cosmic"]
        };

        // Check for element keywords
        for (const [element, keywords] of Object.entries(elementKeywords)) {
            for (const keyword of keywords) {
                if (combinedText.includes(keyword)) {
                    elements.push(element.charAt(0).toUpperCase() + element.slice(1));
                    break;
                }
            }
        }
    }

    // Remove duplicates
    return [...new Set(elements)];
}

function getCardPower(card) {
    /**
     * Extract power from card data
     */
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
    const cardType = getCardType(card).toLowerCase();
    if (cardType && cardType.includes("minion")) {
        return 2;  // Default power for minions
    }
    return 0;
}

function getBaseCardName(name) {
    /**
     * Get the base name of a card, removing set-specific suffixes like "(Foil)" or "(Preconstructed Deck)"
     */
    if (!name) return "";

    // Remove common suffixes
    return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function countOccurrences(arr) {
    /**
     * Count occurrences in an array (similar to Python's Counter)
     */
    return arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
}

function getMostCommon(counter, n = 1) {
    /**
     * Get the n most common items from a counter object
     */
    return Object.entries(counter)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
}

function extractKeywords(text) {
    /**
     * Extract keywords from card text
     */
    if (!text) return [];

    const keywordRegex = /\b(Airborne|Burrowing|Charge|Deathrite|Spellcaster|Stealth|Submerge|Voidwalk|Movement \+\d+|Ranged \d+|Lethal|Lance|Waterbound)\b/g;
    const matches = text.match(keywordRegex);
    return matches || [];
}

async function readCardData(dataSets) {
    // Require here to avoid circular dependency at module load
    const sorceryCards = require('../data/processed/sorceryCards');
    let cards = [];
    if (dataSets && Array.isArray(dataSets)) {
        if (dataSets.length < 2) {
            // If specific set was requested, filter the cards
            const setName = dataSets[0];
            cards = await sorceryCards.getCardsBySet(setName);
            console.log(`Using only ${setName} set cards: ${cards.length} cards`);
        } else {
            cards = await sorceryCards.getAllCards();
            console.log(`Using consolidated card data: ${cards.length} cards from ${dataSets.join(', ')}`);
        }
    } else {
        cards = await sorceryCards.getAllCards();
        console.log(`Using all consolidated card data: ${cards.length} cards`);
    }
    // Add processed attributes to each card for easy access
    return cards.map(card => ({
        ...card,
        type: getCardType(card),
        mana_cost: getCardCost(card),
        text: getCardDescription(card),
        elements: getCardElements(card),
        power: getCardPower(card),
        rarity: getCardRarity(card),
        baseName: getBaseCardName(card.name || '')
    }));
}

function transformRawCardToCard(rawCard) {
    const manaCost = getCardCost(rawCard);
    const cardType = getCardType(rawCard);
    const elements = getCardElements(rawCard);
    const power = getCardPower(rawCard);
    const rarity = getCardRarity(rawCard);
    const text = getCardDescription(rawCard);
    const baseName = getBaseCardName(rawCard.name);
    let life = undefined;
    if (rawCard.extLife) {
        const parsedLife = parseInt(rawCard.extLife, 10);
        if (!isNaN(parsedLife)) life = parsedLife;
    }
    let defense = undefined;
    if (rawCard.extDefensePower) {
        const parsedDefense = parseInt(rawCard.extDefensePower, 10);
        if (!isNaN(parsedDefense)) defense = parsedDefense;
    }
    return {
        ...rawCard,
        type: cardType,
        mana_cost: manaCost,
        cost: manaCost,
        text: text,
        elements: elements,
        power: power,
        rarity: rarity,
        baseName: baseName,
        life: life,
        defense: defense,
        threshold: rawCard.extThreshold || '',
        subtype: rawCard.extCardSubtype || undefined,
    };
}

function parseThreshold(thresholdStr) {
    if (!thresholdStr) return {};
    
    const thresholdMap = {};
    
    // Count occurrences of each element letter in the threshold string
    // The format is like "WW" for 2 Water, "AA" for 2 Air, "F" for 1 Fire, etc.
    for (const char of thresholdStr.toUpperCase()) {
        let elementName;
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

function getCardThreshold(card) {
    // If it's already a Card with parsed threshold somewhere, check for it
    if (card.parsedThreshold) {
        return card.parsedThreshold;
    }
    
    // Get threshold string from various possible sources
    let thresholdStr = '';
    if (card.threshold) {
        thresholdStr = card.threshold;
    } else if (card.extThreshold) {
        thresholdStr = card.extThreshold;
    }
    
    return parseThreshold(thresholdStr);
}

function filterOutRubble(cards) {
    return cards.filter(card => !((card.name || '').toLowerCase().includes('rubble')));
}

module.exports = {
    getCardAttribute,
    getCardType,
    getCardRarity,
    getCardCost,
    getCardDescription,
    getCardElements,
    getCardPower,
    getBaseCardName,
    countOccurrences,
    getMostCommon,
    extractKeywords,
    parseThreshold,
    getCardThreshold,
    filterOutRubble,
    transformRawCardToCard,
    readCardData
};
