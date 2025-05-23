import { Card, CardMechanics } from '../../types/Card';

/**
 * Analyzes a card and identifies its mechanical properties and capabilities
 * @param card The card to analyze
 * @returns An object containing boolean flags for each identified mechanic
 */
export function identifyCardMechanics(card: Card): CardMechanics {
    const text = (card.text || "").toLowerCase();
    const mechanics: CardMechanics = {
        // Region-specific mechanics
        operatesUnderground: text.includes("burrowing") || text.includes("underground"),
        operatesUnderwater: text.includes("submerge") || text.includes("underwater"),
        operatesVoid: text.includes("voidwalk") || text.includes("void"),

        // Combat mechanics
        dealsAOEDamage: text.includes("deals") && (text.includes("each") || text.includes("all") || text.includes("grid")),
        drawsCards: text.includes("draw") && !text.includes("drawback"),
        dealsDirectDamage: text.includes("damage") && (text.includes("enemy") || text.includes("opponent")),
        producesResources: text.includes("add") && (text.includes("mana") || text.includes("energy")),
        controlsMinions: text.includes("destroy") || text.includes("exile") || text.includes("return to hand"),
        enhancesMinions: text.includes("gain") && (text.includes("power") || text.includes("health")),
        triggersOnSpells: text.includes("when") && text.includes("cast") && text.includes("spell"),
        
        // Movement and positioning
        hasAirborne: text.includes("airborne"),
        hasBurrowing: text.includes("burrowing"),
        hasCharge: text.includes("charge"),
        supportsDefense: text.includes("defend") || text.includes("protection") || text.includes("shield"),
        
        // Advanced combat
        hasStrikeFirst: text.includes("strike first") || text.includes("lance"),
        hasLethal: text.includes("lethal"),
        hasInterceptAdvantage: text.includes("intercept") || text.includes("ranged"),
    };

    return mechanics;
}

/**
 * Determines if a card can be included with a specific avatar based on game rules
 * @param card The card to check
 * @param avatar The avatar card to check compatibility with
 * @returns True if the card can be included with the avatar, false otherwise
 */
export function canIncludeWithAvatar(card: Card | null | undefined, avatar: Card | null | undefined): boolean {
    // Skip the check if card or avatar is missing
    if (!card || !avatar) return true;

    const cardName = (card.baseName || card.name || "").toLowerCase();
    const avatarName = (avatar.baseName || avatar.name || "").toLowerCase();

    // Tawny and Bruin can only be used with Druid avatar
    if ((cardName.includes("tawny") || cardName.includes("bruin")) && !avatarName.includes("druid")) {
        return false;
    }

    // Add more avatar restrictions as needed

    return true;
}

/**
 * Evaluates the regional strategy focus of a deck
 * @param deck The deck to evaluate
 * @returns A string indicating the regional strategy: "underground", "underwater", "airborne", or "mixed"
 */
export function evaluateRegionalStrategy(deck: Card[]): string {
    const undergroundCount = deck.filter(c => identifyCardMechanics(c).operatesUnderground).length;
    const underwaterCount = deck.filter(c => identifyCardMechanics(c).operatesUnderwater).length;
    const airborneCount = deck.filter(c => (c.text || "").toLowerCase().includes("airborne")).length;
    
    // Determine if deck has a clear regional focus
    if (undergroundCount > 10) return "underground";
    if (underwaterCount > 10) return "underwater";
    if (airborneCount > 10) return "airborne";
    return "mixed";
}
