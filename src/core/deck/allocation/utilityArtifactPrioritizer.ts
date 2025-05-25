import { Card } from '../../../types/Card';
import { Combo } from '../../cards/cardCombos';

/**
 * High-value utility artifacts that should be prioritized
 */
const UTILITY_ARTIFACT_NAMES = [
    'ring of morrigan',
    'amulet of niniane', 
    'philosopher\'s stone',
    'amethyst core',
    'onyx core',
    'ruby core',
    'aquamarine core'
];

/**
 * Check if a card is a utility artifact
 */
export function isUtilityArtifact(card: Card): boolean {
    const baseName = card.baseName?.toLowerCase() || '';
    return UTILITY_ARTIFACT_NAMES.some(name => baseName.includes(name));
}

/**
 * Sort artifacts with utility prioritization in combo decks
 */
export function sortArtifactsWithUtilityPriority(
    artifacts: Card[], 
    selectedSpells: Card[], 
    hasUtilityCombo: boolean,
    comboPieces: Set<string>,
    calculateSynergy: (card: Card, deck: Card[]) => number
): Card[] {
    const isComboCard = (card: Card): boolean => card.baseName ? comboPieces.has(card.baseName) : false;
    
    return [...artifacts]
        .filter((card: Card) => !selectedSpells.some((s: Card) => s.baseName === card.baseName))
        .sort((a: Card, b: Card) => {
            // HIGHEST PRIORITY: Utility artifacts in combo decks
            if (hasUtilityCombo) {
                const aIsUtility = isUtilityArtifact(a);
                const bIsUtility = isUtilityArtifact(b);
                if (aIsUtility !== bIsUtility) {
                    return bIsUtility ? 1 : -1; // Utility artifacts first
                }
            }
            
            // SECOND PRIORITY: General combo pieces
            if (isComboCard(a) !== isComboCard(b)) {
                return isComboCard(b) ? 1 : -1;
            }
            
            // THIRD PRIORITY: Synergy score
            return calculateSynergy(b, selectedSpells) - calculateSynergy(a, selectedSpells);
        });
}
