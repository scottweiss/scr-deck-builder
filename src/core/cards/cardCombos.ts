/**
 * Card Combo System for Sorcery: Contested Realm
 * 
 * This module identifies powerful card combinations and their synergies
 * to help the deck builder create more cohesive and powerful decks.
 * 
 * Enhanced with position-based combo detection and elemental threshold awareness.
 */

import { Card } from '../../types/Card';

export interface Combo {
    name: string;
    cards: string[];
    synergy: number;
    description: string;
    strategy?: string;
}

export interface ArchetypeMatch {
    archetype: string;
    strength: number;
    cards: Card[];
    description: string;
}

/**
 * Identifies known powerful card combinations
 * @param cards - Array of cards to check for combos
 * @returns List of combos found with contributing cards and synergy score
 */
export function identifyCardCombos(cards: Card[]): Combo[] {
    const combos: Combo[] = [];
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
        return combos;
    }
    
    // Create a map of card names to card objects
    // Handle possible undefined baseNames gracefully
    const cardNames = new Map<string, Card>();
    for (const card of cards) {
        const baseName = (card.baseName || card.name || "").toLowerCase();
        if (baseName) {
            cardNames.set(baseName, card);
        }
    }
    
    // Check for specific powerful combos
    checkElementalLockCombo(cardNames, combos);
    checkManaAccelerationCombo(cardNames, combos);
    checkRecursionCombo(cardNames, combos);
    checkControlCombo(cardNames, combos);
    checkSwarmCombo(cardNames, combos);
    checkSiteDefenseCombo(cardNames, combos);
    checkUndergroundCombo(cardNames, combos);
    checkWaterCombo(cardNames, combos);
    checkAirborneDominanceCombo(cardNames, combos);
    
    // New position-based combos
    checkMultiPositionMasteryCombo(cardNames, combos);
    checkUndergroundNetworkCombo(cardNames, combos);
    checkWaterDominanceEngineCombo(cardNames, combos);
    checkAerialSuperiorityChamberCombo(cardNames, combos);
    checkPositionalControlCombo(cardNames, combos);
    
    // New element threshold-based combos
    checkElementalConvergenceCombo(cardNames, combos);
    checkElementalThresholdCombo(cardNames, combos);
    
    return combos;
}

function checkElementalLockCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const lockCards = [
        "Elemental Lock",
        "Prismatic Lock", 
        "Mana Drain"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of lockCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Elemental Lock Engine",
            cards: foundCards,
            synergy: foundCards.length * 15,
            description: "Combines elemental restriction effects to limit opponent's options",
            strategy: "Use early to restrict opponent's mana base and card choices"
        });
    }
}

function checkManaAccelerationCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const accelerationCards = [
        "Mana Crystal",
        "Elemental Surge",
        "Ancient Wellspring",
        "Ley Line"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of accelerationCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Mana Acceleration Engine",
            cards: foundCards,
            synergy: foundCards.length * 12,
            description: "Accelerates mana production for explosive turns",
            strategy: "Play early to enable high-cost threats ahead of curve"
        });
    }
}

function checkRecursionCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const recursionCards = [
        "Resurrection",
        "Return to Hand",
        "Eternal Return",
        "Phoenix Revival"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of recursionCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Recursion Engine",
            cards: foundCards,
            synergy: foundCards.length * 10,
            description: "Provides card advantage through repeated use of key cards",
            strategy: "Focus on high-value targets for recursion effects"
        });
    }
}

function checkControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const controlCards = [
        "Counterspell",
        "Dispel",
        "Control Magic",
        "Nullify"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of controlCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 3) {
        combos.push({
            name: "Control Package",
            cards: foundCards,
            synergy: foundCards.length * 8,
            description: "Comprehensive control suite to manage threats",
            strategy: "Hold up mana to respond to opponent's key plays"
        });
    }
}

function checkSwarmCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const swarmCards = [
        "Token Generator",
        "Swarm of Creatures",
        "Mass Summon",
        "Creature Horde"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of swarmCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Swarm Strategy",
            cards: foundCards,
            synergy: foundCards.length * 11,
            description: "Overwhelms opponent with numerous creatures",
            strategy: "Deploy quickly and apply pressure before opponent can stabilize"
        });
    }
}

function checkSiteDefenseCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const defenseCards = [
        "Site Ward",
        "Defensive Barrier",
        "Protective Aura",
        "Guardian Spirit"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of defenseCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Site Defense Network",
            cards: foundCards,
            synergy: foundCards.length * 9,
            description: "Protects key sites from opponent attacks",
            strategy: "Use to secure important sites and maintain territorial advantage"
        });
    }
}

function checkUndergroundCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const undergroundCards = [
        "Underground Network",
        "Tunnel System",
        "Subterranean Route",
        "Hidden Passage"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of undergroundCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Underground Network",
            cards: foundCards,
            synergy: foundCards.length * 13,
            description: "Enables surprise attacks and positional advantages",
            strategy: "Use for unexpected tactical maneuvers and site access"
        });
    }
}

function checkWaterCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const waterCards = [
        "Water Mastery",
        "Tidal Wave",
        "Ocean Control",
        "Aquatic Dominance"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of waterCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Water Dominance",
            cards: foundCards,
            synergy: foundCards.length * 14,
            description: "Controls water-based positions and effects",
            strategy: "Dominate aquatic sites and use water-based advantages"
        });
    }
}

function checkAirborneDominanceCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const airborneCards = [
        "Flying Creatures",
        "Air Superiority",
        "Wind Control",
        "Sky Dominance"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of airborneCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Airborne Dominance",
            cards: foundCards,
            synergy: foundCards.length * 12,
            description: "Controls the skies and aerial combat",
            strategy: "Use flying units to bypass ground defenses"
        });
    }
}

function checkMultiPositionMasteryCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const positionCards = [
        "Position Master",
        "Tactical Advantage",
        "Strategic Placement",
        "Positional Control"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of positionCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Multi-Position Mastery",
            cards: foundCards,
            synergy: foundCards.length * 16,
            description: "Enables control of multiple strategic positions",
            strategy: "Coordinate attacks across multiple fronts"
        });
    }
}

function checkUndergroundNetworkCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const networkCards = [
        "Underground Network",
        "Secret Tunnel",
        "Hidden Route",
        "Subterranean Path"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of networkCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 3) {
        combos.push({
            name: "Underground Network",
            cards: foundCards,
            synergy: foundCards.length * 18,
            description: "Creates extensive underground movement system",
            strategy: "Use for surprise attacks and bypassing defenses"
        });
    }
}

function checkWaterDominanceEngineCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const waterEngineCards = [
        "Water Engine",
        "Aquatic Control",
        "Ocean Mastery",
        "Tidal Control"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of waterEngineCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Water Dominance Engine",
            cards: foundCards,
            synergy: foundCards.length * 17,
            description: "Establishes complete control over water-based strategies",
            strategy: "Focus on water sites and aquatic creature synergies"
        });
    }
}

function checkAerialSuperiorityChamberCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const aerialCards = [
        "Aerial Chamber",
        "Sky Control",
        "Wind Mastery",
        "Flight Superiority"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of aerialCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Aerial Superiority Chamber",
            cards: foundCards,
            synergy: foundCards.length * 15,
            description: "Dominates aerial combat and sky-based positions",
            strategy: "Control high-ground positions and flying creature interactions"
        });
    }
}

function checkPositionalControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const controlCards = [
        "Position Control",
        "Territory Lock",
        "Area Denial",
        "Strategic Hold"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of controlCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Positional Control",
            cards: foundCards,
            synergy: foundCards.length * 14,
            description: "Maintains strategic control over key battlefield positions",
            strategy: "Deny opponent access to crucial sites and positions"
        });
    }
}

function checkElementalConvergenceCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const convergenceCards = [
        "Elemental Convergence",
        "Multi-Element Synergy",
        "Elemental Fusion",
        "Element Harmony"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of convergenceCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Elemental Convergence",
            cards: foundCards,
            synergy: foundCards.length * 20,
            description: "Combines multiple elements for powerful synergistic effects",
            strategy: "Build towards multi-element thresholds for maximum impact"
        });
    }
}

function checkElementalThresholdCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const thresholdCards = [
        "Threshold Bonus",
        "Element Mastery",
        "Power Threshold",
        "Elemental Peak"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of thresholdCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Elemental Threshold",
            cards: foundCards,
            synergy: foundCards.length * 16,
            description: "Rewards reaching specific elemental thresholds",
            strategy: "Focus deck building around threshold requirements"
        });
    }
}

/**
 * Calculates synergy between cards in a combo
 * @param cards - Cards involved in the combo
 * @returns Synergy score
 */
export function calculateComboSynergy(cards: Card[]): number {
    if (!cards || cards.length < 2) return 0;
    
    let synergy = 0;
    
    // Base synergy for having multiple cards
    synergy += (cards.length - 1) * 5;
    
    // Element synergy
    const elements = new Set<string>();
    cards.forEach(card => {
        if (card.elements) {
            card.elements.forEach(element => elements.add(element));
        }
    });
    
    if (elements.size === 1) {
        synergy += 10; // Mono-element bonus
    } else if (elements.size === 2) {
        synergy += 15; // Dual-element synergy
    }
    
    // Type synergy
    const types = new Set<string>();
    cards.forEach(card => {
        if (card.type) {
            types.add(card.type);
        }
    });
    
    if (types.size === 1) {
        synergy += 8; // Same type bonus
    }
    
    // Mana curve synergy
    const manaCosts = cards.map(card => card.mana_cost || 0).sort((a, b) => a - b);
    let curveBonus = 0;
    for (let i = 1; i < manaCosts.length; i++) {
        if (manaCosts[i] - manaCosts[i-1] <= 2) {
            curveBonus += 3; // Good curve progression
        }
    }
    synergy += curveBonus;
    
    return synergy;
}

/**
 * Identifies deck archetypes based on card composition
 * @param cards - All cards in the deck
 * @returns Array of archetype matches with strength ratings
 */
export function identifyDeckArchetypes(cards: Card[]): ArchetypeMatch[] {
    const archetypes: ArchetypeMatch[] = [];
    
    if (!cards || cards.length === 0) return archetypes;
    
    // Analyze card composition
    const cardTypes = new Map<string, number>();
    const elements = new Map<string, number>();
    const manaCurve = new Map<number, number>();
    
    cards.forEach(card => {
        // Count types
        if (card.type) {
            const type = card.type.toLowerCase();
            cardTypes.set(type, (cardTypes.get(type) || 0) + 1);
        }
        
        // Count elements
        if (card.elements) {
            card.elements.forEach(element => {
                elements.set(element, (elements.get(element) || 0) + 1);
            });
        }
        
        // Build mana curve
        const cost = card.mana_cost || 0;
        manaCurve.set(cost, (manaCurve.get(cost) || 0) + 1);
    });
    
    const totalCards = cards.length;
    
    // Check for Control archetype
    const controlCards = (cardTypes.get('magic') || 0) + (cardTypes.get('aura') || 0);
    if (controlCards / totalCards > 0.4) {
        archetypes.push({
            archetype: 'Control',
            strength: Math.min(100, (controlCards / totalCards) * 100),
            cards: cards.filter(card => card.type && ['magic', 'aura'].includes(card.type.toLowerCase())),
            description: 'Focuses on controlling the game through spells and auras'
        });
    }
    
    // Check for Aggro archetype
    const lowCostCards = Array.from(manaCurve.entries())
        .filter(([cost]) => cost <= 3)
        .reduce((sum, [, count]) => sum + count, 0);
    
    if (lowCostCards / totalCards > 0.6) {
        archetypes.push({
            archetype: 'Aggro',
            strength: Math.min(100, (lowCostCards / totalCards) * 100),
            cards: cards.filter(card => (card.mana_cost || 0) <= 3),
            description: 'Focuses on early pressure and quick victories'
        });
    }
    
    // Check for Midrange archetype
    const midCostCards = Array.from(manaCurve.entries())
        .filter(([cost]) => cost >= 3 && cost <= 6)
        .reduce((sum, [, count]) => sum + count, 0);
    
    if (midCostCards / totalCards > 0.5) {
        archetypes.push({
            archetype: 'Midrange',
            strength: Math.min(100, (midCostCards / totalCards) * 100),
            cards: cards.filter(card => {
                const cost = card.mana_cost || 0;
                return cost >= 3 && cost <= 6;
            }),
            description: 'Balanced approach with strong mid-game presence'
        });
    }
    
    // Check for Combo archetype
    const comboCards = identifyCardCombos(cards);
    if (comboCards.length > 0) {
        const comboStrength = comboCards.reduce((sum, combo) => sum + combo.synergy, 0) / 10;
        archetypes.push({
            archetype: 'Combo',
            strength: Math.min(100, comboStrength),
            cards: cards.filter(card => 
                comboCards.some(combo => 
                    combo.cards.includes(card.name || '') || 
                    combo.cards.includes(card.baseName || '')
                )
            ),
            description: 'Relies on specific card combinations for powerful effects'
        });
    }
    
    return archetypes.sort((a, b) => b.strength - a.strength);
}

/**
 * Calculates archetype synergy for a set of cards
 * @param cards - Cards to analyze
 * @param targetArchetype - Target archetype to optimize for
 * @returns Synergy score for the archetype
 */
export function calculateArchetypeSynergy(cards: Card[], targetArchetype: string): number {
    const archetypes = identifyDeckArchetypes(cards);
    const archetype = archetypes.find(arch => arch.archetype.toLowerCase() === targetArchetype.toLowerCase());
    
    if (!archetype) return 0;
    
    let synergy = archetype.strength;
    
    // Bonus for cards that fit the archetype well
    const archetypeCards = archetype.cards;
    const archetypeRatio = archetypeCards.length / cards.length;
    
    // Element consistency bonus
    const elements = new Map<string, number>();
    archetypeCards.forEach(card => {
        if (card.elements) {
            card.elements.forEach(element => {
                elements.set(element, (elements.get(element) || 0) + 1);
            });
        }
    });
    
    const dominantElements = Array.from(elements.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);
    
    if (dominantElements.length > 0) {
        const elementName = dominantElements[0][0];
        const elementCount = dominantElements[0][1];
        const elementRatio = elementCount / archetypeCards.length;
        
        // Bonus for element focus
        synergy += elementRatio * 20;
        
        // Check for element mentions in text
        archetypeCards.forEach(card => {
            const text = (card.text || '').toLowerCase();
            if (text.includes(elementName.toLowerCase())) {
                synergy += 3;
            }
        });
    }
    
    return synergy;
}
