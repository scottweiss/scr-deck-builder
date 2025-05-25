import { Card, CardRarity } from '../../../types/Card';
import { DeckValidationResult } from '../../../types/Deck';
import { getMaxCopiesForRarity } from '../optimization/deckOptimizer';

/**
 * Validates a complete deck according to official Sorcery: Contested Realm rules
 */
export class DeckValidator {
    /**
     * Validates an entire deck against all game rules
     */
    static validateDeck(
        avatar: Card, 
        sites: Card[], 
        spells: Card[]
    ): DeckValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Rule: Avatar does not count toward deck totals per official rules
        // Avatar is validated separately and is not part of Atlas or Spellbook

        // Rule: Atlas must contain at least 30 site cards
        if (sites.length < 30) {
            errors.push(`Atlas must contain at least 30 sites (currently has ${sites.length})`);
        }

        // Rule: Spellbook must contain at least 50 spell cards
        if (spells.length < 50) {
            errors.push(`Spellbook must contain at least 50 spells (currently has ${spells.length})`);
        }

        // Rule: Maximum deck size should be reasonable for shuffling
        if (sites.length > 100) {
            warnings.push(`Atlas is very large (${sites.length} cards) - may be difficult to shuffle`);
        }
        if (spells.length > 100) {
            warnings.push(`Spellbook is very large (${spells.length} cards) - may be difficult to shuffle`);
        }

        // Validate rarity limits for sites
        const siteRarityErrors = this.validateRarityLimits(sites, "sites");
        errors.push(...siteRarityErrors);

        // Validate rarity limits for spells
        const spellRarityErrors = this.validateRarityLimits(spells, "spells");
        errors.push(...spellRarityErrors);

        // Validate elemental threshold requirements
        const thresholdWarnings = this.validateElementalThresholds(sites, spells);
        warnings.push(...thresholdWarnings);

        // Validate spellcaster restrictions and support
        const spellcasterWarnings = this.validateSpellcasterRestrictions(spells);
        warnings.push(...spellcasterWarnings);

        // Validate regional strategy consistency
        const regionalWarnings = this.validateRegionalStrategy(sites, spells);
        warnings.push(...regionalWarnings);

        // Validate avatar compatibility
        if (avatar) {
            const avatarWarnings = this.validateAvatarCompatibility(avatar, [...sites, ...spells]);
            warnings.push(...avatarWarnings);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            totalCards: sites.length + spells.length + (avatar ? 1 : 0),
            spellbookSize: spells.length,
            siteCount: sites.length
        };
    }

    /**
     * Validates rarity limits for a group of cards
     */
    private static validateRarityLimits(cards: Card[], groupName: string): string[] {
        const errors: string[] = [];
        const cardCounts = new Map<string, number>();

        // Count copies of each card
        for (const card of cards) {
            const key = card.baseName || card.name;
            if (key) {
                cardCounts.set(key, (cardCounts.get(key) || 0) + 1);
            }
        }

        // Check copy limits based on rarity
        for (const [cardName, count] of cardCounts.entries()) {
            const card = cards.find(c => (c.baseName || c.name) === cardName);
            if (card) {
                const maxCopies = getMaxCopiesForRarity(card.rarity as CardRarity);
                if (count > maxCopies) {
                    errors.push(
                        `${groupName} contains ${count}x "${cardName}" - maximum of ${maxCopies} allowed for ${card.rarity} cards`
                    );
                }
            }
        }

        return errors;
    }

    /**
     * Validates elemental thresholds are achievable
     */
    private static validateElementalThresholds(sites: Card[], spells: Card[]): string[] {
        const warnings: string[] = [];
        const elementCounts: Record<string, number> = {};

        // Count elements from both sites and spells
        for (const card of [...sites, ...spells]) {
            const elements = card.elements || [];
            for (const element of elements) {
                elementCounts[element] = (elementCounts[element] || 0) + 1;
            }
        }

        // Check each card's threshold requirements
        for (const card of spells) {
            const threshold = card.threshold;
            if (threshold) {
                const matches = threshold.match(/(\d+)\s+(Water|Fire|Earth|Air|Void)/gi);
                if (matches) {
                    for (const match of matches) {
                        const [_, count, element] = match.match(/(\d+)\s+(Water|Fire|Earth|Air|Void)/i)!;
                        const required = parseInt(count);
                        const available = elementCounts[element] || 0;

                        if (available < required) {
                            warnings.push(
                                `Deck may struggle to meet ${element} threshold (${required}) for "${card.name}" - only ${available} sources available`
                            );
                        }
                    }
                }
            }
        }

        return warnings;
    }

    /**
     * Validates spellcaster support and restrictions
     */
    private static validateSpellcasterRestrictions(spells: Card[]): string[] {
        const warnings: string[] = [];
        const spellcasterMinionCount = spells.filter(card => 
            (card.text || "").toLowerCase().includes("spellcaster") && card.type === "Minion"
        ).length;

        const spellCount = spells.filter(card => 
            card.type === "Magic"
        ).length;

        // Note: All Avatars are inherently Spellcasters per official rules
        // Only warn about minion spellcasters if there are many spells requiring specific casting
        const totalSpellcasters = spellcasterMinionCount + 1; // +1 for Avatar which is always a spellcaster

        // Only warn if there are many magic spells but very few total spellcasters
        if (spellCount > 20 && totalSpellcasters < 3) {
            warnings.push(
                `Deck contains ${spellCount} magic spells but only ${totalSpellcasters} total spellcasters (including Avatar) - consider adding spellcaster minions`
            );
        }

        return warnings;
    }

    /**
     * Validates regional strategy consistency
     */
    private static validateRegionalStrategy(sites: Card[], spells: Card[]): string[] {
        const warnings: string[] = [];
        
        // Count cards with different regional mechanics
        const underground = spells.filter(card => 
            (card.text || "").toLowerCase().includes("underground") ||
            (card.text || "").toLowerCase().includes("burrowing")
        ).length;

        const underwater = spells.filter(card => 
            (card.text || "").toLowerCase().includes("underwater") ||
            (card.text || "").toLowerCase().includes("submerge")
        ).length;

        const airborne = spells.filter(card => 
            (card.text || "").toLowerCase().includes("airborne") ||
            (card.text || "").toLowerCase().includes("flying")
        ).length;

        // Warn about mixed strategies if multiple are present in significant numbers
        if ((underground > 5 && underwater > 5) || 
            (underground > 5 && airborne > 5) || 
            (underwater > 5 && airborne > 5)) {
            warnings.push(
                "Deck mixes multiple positional strategies - consider focusing on one primary position"
            );
        }

        return warnings;
    }

    /**
     * Validates avatar compatibility with deck contents
     */
    private static validateAvatarCompatibility(avatar: Card, allCards: Card[]): string[] {
        const warnings: string[] = [];
        
        // Check for avatar-specific restrictions
        const avatarText = (avatar.text || "").toLowerCase();
        
        // Some avatars may have restrictions on card types or elements
        if (avatarText.includes("cannot") || avatarText.includes("may not") || avatarText.includes("only")) {
            // This would need to be expanded based on specific avatar restrictions
            // For now, just flag that manual review may be needed
            warnings.push(
                `Avatar "${avatar.name}" may have deck building restrictions - manual review recommended`
            );
        }

        return warnings;
    }
}
