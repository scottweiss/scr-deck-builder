import { CardAllocation } from '../../../types/Card';
import { Combo } from '../../cards/cardCombos';

export interface AllocationResult {
    allocation: CardAllocation;
    adjustmentReason?: string;
}

/**
 * Calculate card allocation based on detected combos and deck archetype
 */
export function calculateCardAllocation(
    availableCombos: Combo[], 
    baseAllocation: CardAllocation
): AllocationResult {
    // Check for utility-focused combos
    const hasUtilityCombo = availableCombos.some((combo: Combo) => 
        combo.name.includes('Utility') || 
        combo.name.includes('Cost Reduction') || 
        combo.name.includes('Core') ||
        combo.name.includes('Threshold') ||
        combo.name.includes('Artifact')
    );
    
    // Start with base allocation
    let finalAllocation = {
        minions: baseAllocation.minions,
        artifacts: baseAllocation.artifacts,
        auras: baseAllocation.auras,
        magics: baseAllocation.magics,
    };
    
    let adjustmentReason: string | undefined;
    
    // Increase artifact allocation for combo decks with utility focus
    if (hasUtilityCombo && availableCombos.length >= 3) {
        console.log("🔧 Detected utility combo archetype - adjusting allocation to favor artifacts");
        finalAllocation.artifacts = Math.min(15, finalAllocation.artifacts + 5); // Increase by 5, cap at 15
        finalAllocation.minions = Math.max(20, finalAllocation.minions - 3); // Reduce minions slightly
        finalAllocation.magics = Math.max(12, finalAllocation.magics - 2); // Reduce magics slightly
        adjustmentReason = "Utility combo archetype detected - increased artifact allocation";
    }
    
    return {
        allocation: finalAllocation,
        adjustmentReason
    };
}
