import { Card, Element as ElementEnum } from '../types/Card';

const utils = require('../utils/utils');
const cardAnalysis = require('../core/cards/cardAnalysis');

export interface AvatarSelectionResult {
    selectedAvatar: Card | undefined;
    dominantElement: string;
}

/**
 * Select the best avatar based on element preferences and card synergies
 */
export function selectAvatar(
    avatars: Card[],
    elements: string[],
    keywords: string[],
    uniqueCards: Card[],
    preferredElement?: string | null
): AvatarSelectionResult {
    const elementCounter = utils.countOccurrences(elements);
    const keywordCounter = utils.countOccurrences(keywords);

    // Use preferred element from command line or use most common
    let dominantElement: string;
    if (preferredElement) {
        dominantElement = preferredElement.charAt(0).toUpperCase() + 
                         preferredElement.slice(1).toLowerCase();
        console.log(`Using preferred element: ${dominantElement}`);
    } else if (Object.keys(elementCounter).length === 0) {
        dominantElement = "Water";  // Default element
    } else {
        dominantElement = utils.getMostCommon(elementCounter, 1)[0][0];
    }

    // Select Avatar based on keyword synergy
    let selectedAvatar: Card | undefined = undefined;
    for (const avatar of avatars) {
        const avatarElements = avatar.elements;
        if (avatarElements && avatarElements.some((element: ElementEnum) => 
            element.toString().toLowerCase() === dominantElement.toLowerCase())) {
            selectedAvatar = avatar;
            break;
        }
    }

    if (!selectedAvatar && avatars.length > 0) {
        selectedAvatar = avatars[0];  // Default to first avatar if no match
    } else if (!selectedAvatar) {
        console.log("Warning: No avatars found in the card pool.");
    }

    if (selectedAvatar) {
        console.log(`Selected Avatar: ${selectedAvatar.name}`);

        // Check for and report any avatar-restricted cards in the pool
        const restrictedCards = uniqueCards.filter(card => 
            !cardAnalysis.canIncludeWithAvatar(card, selectedAvatar));
        if (restrictedCards.length > 0) {
            console.log(`Note: The following cards cannot be used with ${selectedAvatar.name} and will be excluded:`);
            restrictedCards.forEach(card => console.log(`- ${card.name || "Unknown Card"}`));
        }
    }

    return {
        selectedAvatar,
        dominantElement
    };
}
