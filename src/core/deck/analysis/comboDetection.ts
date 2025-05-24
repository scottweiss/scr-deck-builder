import { Card } from '../../../types/Card';
import { Combo, identifyCardCombos } from '../../cards/cardCombos';

export interface ComboAnalysisResult {
    availableCombos: Combo[];
    comboPieces: Set<string>;
    hasUtilityCombo: boolean;
}

/**
 * Analyze available combos in the card pool and create priority sets
 */
export function analyzeCardCombos(
    minions: Card[], 
    artifacts: Card[], 
    auras: Card[], 
    magics: Card[], 
    uniqueCards: Card[]
): ComboAnalysisResult {
    // Identify available combos in the card pool
    const availableCombos = identifyCardCombos(uniqueCards);
    
    console.log(`Identified ${availableCombos.length} potential card combos in the card pool`);
    
    // Check for utility-focused combos
    const hasUtilityCombo = availableCombos.some((combo: Combo) => 
        combo.name.includes('Utility') || 
        combo.name.includes('Cost Reduction') || 
        combo.name.includes('Core') ||
        combo.name.includes('Threshold') ||
        combo.name.includes('Artifact')
    );
    
    // Create combo pieces priority set
    const comboPieces = new Set<string>();
    if (availableCombos.length > 0) {
        // Sort combos by synergy score
        availableCombos.sort((a: Combo, b: Combo) => b.synergy - a.synergy);
        
        // Log the top 3 combos
        console.log("Top card combos identified:");
        availableCombos.slice(0, 3).forEach((combo: Combo) => {
            console.log(`- ${combo.name}: ${combo.description}`);
            
            // Add combo pieces to our priority set
            combo.cards.forEach((cardName: string) => {
                comboPieces.add(cardName);
            });
        });
    }
    
    return {
        availableCombos,
        comboPieces,
        hasUtilityCombo
    };
}
