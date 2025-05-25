import { Card } from '../types/Card';
import { DeckValidator } from '../core/deck/analysis/deckValidator';
import RuleEnforcer from '../core/rules/ruleEnforcer';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: any[];
    advancedWarnings: string[];
}

/**
 * Validate deck according to official rules and generate improvement suggestions
 */
export function validateDeck(
    selectedAvatar: Card,
    selectedSites: Card[],
    selectedSpells: Card[]
): ValidationResult {
    console.log("\n=== DECK VALIDATION ===");
    
    const validationResult = DeckValidator.validateDeck(selectedAvatar, selectedSites, selectedSpells);
    
    if (validationResult.errors.length > 0) {
        console.log("❌ DECK VALIDATION ERRORS:");
        validationResult.errors.forEach((error: string) => console.log(`  • ${error}`));
    }
    
    if (validationResult.warnings.length > 0) {
        console.log("⚠️  DECK VALIDATION WARNINGS:");
        validationResult.warnings.forEach((warning: string) => console.log(`  • ${warning}`));
    }
    
    if (validationResult.isValid) {
        console.log("✅ Deck passes all official rule validations!");
    } else {
        console.log("❌ Deck has rule violations that must be fixed before play.");
    }
    
    // Generate improvement suggestions
    const suggestions = RuleEnforcer.generateImprovementSuggestions(
        selectedAvatar, selectedSites, selectedSpells, validationResult
    );
    const advancedWarnings = RuleEnforcer.checkAdvancedRules(
        selectedAvatar, selectedSites, selectedSpells
    );
    
    if (suggestions.length > 0 || advancedWarnings.length > 0) {
        console.log("\n💡 DECK IMPROVEMENT SUGGESTIONS:");
        
        suggestions.forEach((suggestion: any) => {
            const priorityIcon = suggestion.priority === 'High' ? '🔴' : 
                               suggestion.priority === 'Medium' ? '🟡' : '🟢';
            console.log(`${priorityIcon} ${suggestion.issue}: ${suggestion.suggestion}`);
            console.log(`   📚 Rule: ${suggestion.ruleRef}`);
        });
        
        advancedWarnings.forEach((warning: string) => {
            console.log(`🟡 Advanced: ${warning}`);
        });
    }

    return {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        suggestions,
        advancedWarnings
    };
}
