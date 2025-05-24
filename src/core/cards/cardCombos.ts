/**
 * Card Combo System for Sorcery: Contested Realm
 * 
 * This module identifies powerful card combinations and their synergies
 * to help the deck builder create more cohesive and powerful decks.
 * 
 * Enhanced with position-based combo detection and elemental threshold awareness.
 */

import { Card, Element } from '../../types/Card';

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
    
    // New combo types discovered from CSV analysis
    checkEquipmentSynergyCombo(cardNames, combos);
    checkTribalCounterCombo(cardNames, combos);
    checkMovementControlCombo(cardNames, combos);
    checkAlternativeWinCombo(cardNames, combos);
    checkSiteTransformationCombo(cardNames, combos);
    checkDisableControlCombo(cardNames, combos);
    checkVoidwalkResurrectionCombo(cardNames, combos);
    checkDeathriteSynergyCombo(cardNames, combos);
    checkFloodingCombo(cardNames, combos);
    
    // Additional combo types from expanded CSV analysis
    checkTokenGenerationCombo(cardNames, combos);
    checkDamageAmplifierCombo(cardNames, combos);
    checkTransformationCombo(cardNames, combos);
    checkLethalSynergyCombo(cardNames, combos);
    checkCountdownDeviceCombo(cardNames, combos);
    checkImmobilizeControlCombo(cardNames, combos);
    checkMindControlCombo(cardNames, combos);
    checkArtifactTheftCombo(cardNames, combos);
    checkCostReductionCombo(cardNames, combos);
    checkMultiElementSynergyCombo(cardNames, combos);
    
    // New combo types from Arthurian Legends analysis
    checkLanceSynergyCombo(cardNames, combos);
    checkSpellcasterInteractionCombo(cardNames, combos);
    checkProjectileCombo(cardNames, combos);
    checkCurseEffectCombo(cardNames, combos);
    checkAuraDispelCombo(cardNames, combos);
    checkPositionStrategyCombo(cardNames, combos);
    checkMutationChainCombo(cardNames, combos);
    
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
 * Equipment and Weapon Synergy Combo
 * Detects synergies between equipment cards and bearer abilities
 */
function checkEquipmentSynergyCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const equipmentCards = [
        "Truesight Crossbow",
        "Crown of the Victor", 
        "Torshammar Trinket",
        "Weapon",
        "Armor",
        "Relic"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of equipmentCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    // Also check for cards with "Bearer" in text (equipment effects)
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        const cardType = (card.type || '').toLowerCase();
        const subtype = (card.subtype || '').toLowerCase();
        
        if (text.includes('bearer') || 
            subtype.includes('weapon') || 
            subtype.includes('armor') || 
            subtype.includes('relic')) {
            foundCards.push(card.name || name);
        }
    });
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Equipment Synergy",
            cards: foundCards,
            synergy: foundCards.length * 12,
            description: "Equipment and weapons that enhance bearer capabilities",
            strategy: "Focus on creatures that can effectively use multiple equipment pieces"
        });
    }
}

/**
 * Lance Synergy Combo
 * Detects Lance keyword and combat charge synergies
 */
function checkLanceSynergyCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const lanceCards: string[] = [];
    const chargeCards: string[] = [];
    
    for (const [name, card] of cardNames) {
        const text = (card.text || '').toLowerCase();
        const keywords = (card.extDescription || '').toLowerCase();
        
        if (text.includes('lance') || keywords.includes('lance')) {
            lanceCards.push(card.name || name);
        }
        if (text.includes('charge') || keywords.includes('charge') || 
            text.includes('strikes first') || text.includes('strike first')) {
            chargeCards.push(card.name || name);
        }
    }
    
    if (lanceCards.length >= 2 || (lanceCards.length >= 1 && chargeCards.length >= 2)) {
        const allCards = [...new Set([...lanceCards, ...chargeCards])];
        combos.push({
            name: "Lance Combat Engine",
            cards: allCards,
            synergy: allCards.length * 12,
            description: "Combines lance weapons with charge abilities for aggressive combat",
            strategy: "Focus on early aggressive plays with enhanced combat damage"
        });
    }
}

/**
 * Spellcaster Interaction Combo
 * Detects spells that specifically enhance or require spellcasters
 */
function checkSpellcasterInteractionCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const spellcasterCards: string[] = [];
    const spellcasterSynergy: string[] = [];
    
    for (const [name, card] of cardNames) {
        const text = (card.text || '').toLowerCase();
        const keywords = (card.extDescription || '').toLowerCase();
        
        if (text.includes('spellcaster') || keywords.includes('spellcaster')) {
            spellcasterCards.push(card.name || name);
        }
        
        if (text.includes('spell') && (
            text.includes('cast an additional') ||
            text.includes('when you cast') ||
            text.includes('spells cost') ||
            text.includes('spell threshold') ||
            text.includes('spell damage')
        )) {
            spellcasterSynergy.push(card.name || name);
        }
    }
    
    if (spellcasterCards.length >= 2 && spellcasterSynergy.length >= 2) {
        const allCards = [...new Set([...spellcasterCards, ...spellcasterSynergy])];
        combos.push({
            name: "Spellcaster Mastery",
            cards: allCards,
            synergy: allCards.length * 14,
            description: "Enhances spellcasting abilities with cost reduction and bonus effects",
            strategy: "Build around spellcaster synergies for spell-heavy control"
        });
    }
}

/**
 * Projectile Combo
 * Detects ranged abilities and area-of-effect projectile synergies
 */
function checkProjectileCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const projectileCards: string[] = [];
    const rangedCards: string[] = [];
    
    for (const [name, card] of cardNames) {
        const text = (card.text || '').toLowerCase();
        const keywords = (card.extDescription || '').toLowerCase();
        
        if (text.includes('projectile') || text.includes('shoot') ||
            keywords.includes('projectile')) {
            projectileCards.push(card.name || name);
        }
        
        if (text.includes('ranged') || keywords.includes('ranged') ||
            text.includes('intercept airborne') || text.includes('range')) {
            rangedCards.push(card.name || name);
        }
    }
    
    if (projectileCards.length >= 2 || (projectileCards.length >= 1 && rangedCards.length >= 2)) {
        const allCards = [...new Set([...projectileCards, ...rangedCards])];
        combos.push({
            name: "Projectile Artillery",
            cards: allCards,
            synergy: allCards.length * 11,
            description: "Combines ranged attacks and projectiles for battlefield control",
            strategy: "Control the field with ranged damage and positioning"
        });
    }
}

/**
 * Curse Effect Combo
 * Detects curse effects and avatar/player targeting
 */
function checkCurseEffectCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const curseCards: string[] = [];
    const targetingCards: string[] = [];
    
    for (const [name, card] of cardNames) {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('curse') || text.includes('cursed') ||
            text.includes('hex') || text.includes('afflict')) {
            curseCards.push(card.name || name);
        }
        
        if (text.includes('target avatar') || text.includes('target player') ||
            text.includes('opponent loses') || text.includes('enemy avatar')) {
            targetingCards.push(card.name || name);
        }
    }
    
    if (curseCards.length >= 2 || (curseCards.length >= 1 && targetingCards.length >= 2)) {
        const allCards = [...new Set([...curseCards, ...targetingCards])];
        combos.push({
            name: "Curse Affliction",
            cards: allCards,
            synergy: allCards.length * 13,
            description: "Applies persistent debuffs and targeted effects on opponents",
            strategy: "Weaken opponents with curses and direct avatar damage"
        });
    }
}

/**
 * Aura Dispel Combo
 * Detects long-lasting auras with dispel conditions
 */
function checkAuraDispelCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const auraCards: string[] = [];
    const dispelCards: string[] = [];
    
    for (const [name, card] of cardNames) {
        const text = (card.text || '').toLowerCase();
        const type = (card.extTypeLine || '').toLowerCase();
        
        if (type.includes('aura') || text.includes('aura')) {
            auraCards.push(card.name || name);
        }
        
        if (text.includes('dispel') || text.includes('remove aura') ||
            text.includes('destroy aura') || text.includes('banish aura')) {
            dispelCards.push(card.name || name);
        }
    }
    
    if (auraCards.length >= 3 && dispelCards.length >= 1) {
        const allCards = [...new Set([...auraCards, ...dispelCards])];
        combos.push({
            name: "Aura Control Matrix",
            cards: allCards,
            synergy: allCards.length * 10,
            description: "Establishes aura dominance with protective dispel effects",
            strategy: "Control the battlefield with persistent auras and removal"
        });
    }
}

/**
 * Position Strategy Combo
 * Detects position-based effects and back row requirements
 */
function checkPositionStrategyCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const positionCards: string[] = [];
    const movementCards: string[] = [];
    
    for (const [name, card] of cardNames) {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('back row') || text.includes('front row') ||
            text.includes('position') || text.includes('adjacent') ||
            text.includes('nearby') || text.includes('location')) {
            positionCards.push(card.name || name);
        }
        
        if (text.includes('move') || text.includes('teleport') ||
            text.includes('step') || text.includes('movement')) {
            movementCards.push(card.name || name);
        }
    }
    
    if (positionCards.length >= 3 && movementCards.length >= 2) {
        const allCards = [...new Set([...positionCards, ...movementCards])];
        combos.push({
            name: "Tactical Positioning",
            cards: allCards,
            synergy: allCards.length * 9,
            description: "Exploits position-based effects with strategic movement",
            strategy: "Maximize positional advantages with careful unit placement"
        });
    }
}

/**
 * Mutation Chain Combo
 * Detects random/variable effects and transformation chains
 */
function checkMutationChainCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const mutationCards: string[] = [];
    const variableCards: string[] = [];
    
    for (const [name, card] of cardNames) {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('mutate') || text.includes('mutation') ||
            text.includes('transform') || text.includes('morph') ||
            text.includes('evolve') || text.includes('change into')) {
            mutationCards.push(card.name || name);
        }
        
        if (text.includes('random') || text.includes('variable') ||
            text.includes('choose one') || text.includes('or') ||
            text.includes('either') || text.includes('different')) {
            variableCards.push(card.name || name);
        }
    }
    
    if (mutationCards.length >= 2 || (mutationCards.length >= 1 && variableCards.length >= 3)) {
        const allCards = [...new Set([...mutationCards, ...variableCards])];
        combos.push({
            name: "Adaptive Evolution",
            cards: allCards,
            synergy: allCards.length * 8,
            description: "Creates unpredictable value through transformation effects",
            strategy: "Adapt to situations with variable and mutation effects"
        });
    }
}

function checkTribalCounterCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const tribalCounterCards: string[] = [];
    
    // Check for cards with tribal immunities or counters
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('takes no damage from') ||
            text.includes('demon') ||
            text.includes('spirit') ||
            text.includes('undead') ||
            text.includes('mortal') ||
            text.includes('beast') ||
            text.includes('dragon')) {
            tribalCounterCards.push(card.name || name);
        }
    });
    
    if (tribalCounterCards.length >= 2) {
        combos.push({
            name: "Tribal Counter Strategy",
            cards: tribalCounterCards,
            synergy: tribalCounterCards.length * 10,
            description: "Cards that counter or interact with specific creature types",
            strategy: "Build around tribal immunities and targeted tribal effects"
        });
    }
}

/**
 * Movement and Positioning Control Combo
 * Detects teleportation, movement manipulation, and positioning effects
 */
function checkMovementControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const movementCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('teleport') ||
            text.includes('move') ||
            text.includes('step') ||
            text.includes('movement') ||
            text.includes('nearby') ||
            text.includes('location') ||
            text.includes('position')) {
            movementCards.push(card.name || name);
        }
    });
    
    if (movementCards.length >= 3) {
        combos.push({
            name: "Movement Control Engine",
            cards: movementCards,
            synergy: movementCards.length * 8,
            description: "Manipulates unit positioning and movement for tactical advantage",
            strategy: "Control the battlefield through strategic positioning and movement denial"
        });
    }
}

/**
 * Alternative Win Condition Combo
 * Detects cards that provide non-standard victory conditions
 */
function checkAlternativeWinCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const altWinCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('wins the game') ||
            text.includes('win') ||
            text.includes('level') ||
            text.includes('counter') ||
            text.includes('avatar here alone') ||
            text.includes('immortal throne')) {
            altWinCards.push(card.name || name);
        }
    });
    
    if (altWinCards.length >= 1) {
        combos.push({
            name: "Alternative Victory",
            cards: altWinCards,
            synergy: altWinCards.length * 25,
            description: "Cards that provide alternative paths to victory",
            strategy: "Build deck to enable and protect alternative win conditions"
        });
    }
}

/**
 * Site Transformation and Control Combo
 * Detects site modification, flooding, and transformation effects
 */
function checkSiteTransformationCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const siteTransformCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('flooded') ||
            text.includes('water site') ||
            text.includes('transform') ||
            text.includes('site control') ||
            text.includes('gain control') ||
            text.includes('flood') ||
            text.includes('destroy a nearby site')) {
            siteTransformCards.push(card.name || name);
        }
    });
    
    if (siteTransformCards.length >= 2) {
        combos.push({
            name: "Site Transformation",
            cards: siteTransformCards,
            synergy: siteTransformCards.length * 14,
            description: "Modifies and controls sites for strategic advantage",
            strategy: "Transform the battlefield to favor your strategy"
        });
    }
}

/**
 * Disable and Sleep Control Combo
 * Detects disable effects, sleep mechanics, and control elements
 */
function checkDisableControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const disableCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('disabled') ||
            text.includes('sleep') ||
            text.includes('fall asleep') ||
            text.includes('constricts and disables') ||
            text.includes('tap') ||
            text.includes('disable')) {
            disableCards.push(card.name || name);
        }
    });
    
    if (disableCards.length >= 2) {
        combos.push({
            name: "Disable Control",
            cards: disableCards,
            synergy: disableCards.length * 11,
            description: "Controls opponents through disable effects and sleep mechanics",
            strategy: "Lock down key enemy threats while developing your own board"
        });
    }
}

/**
 * Voidwalk Resurrection Combo
 * Detects voidwalk creatures and resurrection synergies
 */
function checkVoidwalkResurrectionCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const voidwalkCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('voidwalk') ||
            text.includes('summon each other dead') ||
            text.includes('resurrection') ||
            text.includes('return') ||
            text.includes('void')) {
            voidwalkCards.push(card.name || name);
        }
    });
    
    if (voidwalkCards.length >= 2) {
        combos.push({
            name: "Voidwalk Resurrection",
            cards: voidwalkCards,
            synergy: voidwalkCards.length * 16,
            description: "Uses voidwalk creatures and resurrection effects for value",
            strategy: "Build graveyard value and recurring threats through voidwalk"
        });
    }
}

/**
 * Deathrite Synergy Combo
 * Detects genesis/deathrite synergies and dual-ability cards
 */
function checkDeathriteSynergyCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const deathriteCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('deathrite') ||
            text.includes('genesis') ||
            text.includes('also deathrite') ||
            text.includes('geistwood')) {
            deathriteCards.push(card.name || name);
        }
    });
    
    if (deathriteCards.length >= 2) {
        combos.push({
            name: "Deathrite Synergy",
            cards: deathriteCards,
            synergy: deathriteCards.length * 13,
            description: "Combines genesis and deathrite abilities for versatile effects",
            strategy: "Maximize value from cards with dual genesis/deathrite abilities"
        });
    }
}

/**
 * Flooding and Water Dominance Combo
 * Detects flooding effects and water-based control
 */
function checkFloodingCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const floodingCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        const elements = card.elements || [];
        
        if (text.includes('submerge') ||
            text.includes('waterbound') ||
            text.includes('flooded') ||
            text.includes('water site') ||
            elements.includes(Element.Water) ||
            text.includes('tide') ||
            text.includes('undertow')) {
            floodingCards.push(card.name || name);
        }
    });
    
    if (floodingCards.length >= 3) {
        combos.push({
            name: "Flooding Control",
            cards: floodingCards,
            synergy: floodingCards.length * 9,
            description: "Controls battlefield through water effects and flooding",
            strategy: "Dominate through water-based field control and submerge effects"
        });
    }
}

/**
 * Token Generation Combo
 * Detects token generation spells and token synergies
 */
function checkTokenGenerationCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const tokenCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('token') ||
            text.includes('summon') ||
            text.includes('frog') ||
            text.includes('seven') ||
            text.includes('three') ||
            text.includes('create')) {
            tokenCards.push(card.name || name);
        }
    });
    
    if (tokenCards.length >= 2) {
        combos.push({
            name: "Token Generation Engine",
            cards: tokenCards,
            synergy: tokenCards.length * 11,
            description: "Creates and leverages token creatures for board presence",
            strategy: "Flood the board with tokens and support them with anthem effects"
        });
    }
}

/**
 * Damage Amplifier Combo
 * Detects damage doubling and amplification effects
 */
function checkDamageAmplifierCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const amplifierCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('double damage') ||
            text.includes('take double') ||
            text.includes('deals 1 damage') ||
            text.includes('amplif') ||
            text.includes('except from strikes') ||
            text.includes('lethal')) {
            amplifierCards.push(card.name || name);
        }
    });
    
    if (amplifierCards.length >= 2) {
        combos.push({
            name: "Damage Amplifier",
            cards: amplifierCards,
            synergy: amplifierCards.length * 14,
            description: "Amplifies damage output through multiplication and enhancement",
            strategy: "Combine damage dealers with amplifiers for explosive turns"
        });
    }
}

/**
 * Transformation Combo
 * Detects creature transformation and morph effects
 */
function checkTransformationCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const transformCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('transform') ||
            text.includes('pollimorph') ||
            text.includes('frog token') ||
            text.includes('into a') ||
            text.includes('becomes') ||
            text.includes('morph')) {
            transformCards.push(card.name || name);
        }
    });
    
    if (transformCards.length >= 1) {
        combos.push({
            name: "Transformation Control",
            cards: transformCards,
            synergy: transformCards.length * 13,
            description: "Controls threats through creature transformation",
            strategy: "Neutralize key enemy threats by transforming them"
        });
    }
}

/**
 * Lethal Synergy Combo
 * Detects lethal keyword and instant kill effects
 */
function checkLethalSynergyCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const lethalCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('lethal') ||
            text.includes('kill') ||
            text.includes('destroy') ||
            text.includes('poisonous') ||
            text.includes('bearer has lethal') ||
            text.includes('damage dealt to minions nearby is lethal')) {
            lethalCards.push(card.name || name);
        }
    });
    
    if (lethalCards.length >= 2) {
        combos.push({
            name: "Lethal Synergy",
            cards: lethalCards,
            synergy: lethalCards.length * 12,
            description: "Leverages lethal damage and instant kill effects",
            strategy: "Use lethal damage to trade up and eliminate threats efficiently"
        });
    }
}

/**
 * Countdown Device Combo
 * Detects countdown timers and ticking devices
 */
function checkCountdownDeviceCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const countdownCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        const subtype = (card.subtype || '').toLowerCase();
        
        if (text.includes('counter') ||
            text.includes('countdown') ||
            text.includes('remove a counter') ||
            text.includes('detonates') ||
            text.includes('level') ||
            subtype.includes('device')) {
            countdownCards.push(card.name || name);
        }
    });
    
    if (countdownCards.length >= 1) {
        combos.push({
            name: "Countdown Device",
            cards: countdownCards,
            synergy: countdownCards.length * 15,
            description: "Uses countdown mechanics for delayed powerful effects",
            strategy: "Build around timer-based effects and counter manipulation"
        });
    }
}

/**
 * Immobilize Control Combo
 * Detects immobilization and movement restriction effects
 */
function checkImmobilizeControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const immobilizeCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('immobile') ||
            text.includes('immobilize') ||
            text.includes('can\'t move') ||
            text.includes('cannot move') ||
            text.includes('restricted') ||
            text.includes('unable to move')) {
            immobilizeCards.push(card.name || name);
        }
    });
    
    if (immobilizeCards.length >= 2) {
        combos.push({
            name: "Immobilize Control",
            cards: immobilizeCards,
            synergy: immobilizeCards.length * 10,
            description: "Controls the battlefield through movement restriction",
            strategy: "Lock down enemy units while maintaining your own mobility"
        });
    }
}

/**
 * Mind Control Combo
 * Detects mind control and puppet effects
 */
function checkMindControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const mindControlCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('gain control') ||
            text.includes('controlled by') ||
            text.includes('puppet') ||
            text.includes('control of all') ||
            text.includes('each player is controlled') ||
            text.includes('steal')) {
            mindControlCards.push(card.name || name);
        }
    });
    
    if (mindControlCards.length >= 1) {
        combos.push({
            name: "Mind Control",
            cards: mindControlCards,
            synergy: mindControlCards.length * 18,
            description: "Gains control of enemy units and manipulates opponents",
            strategy: "Turn enemy threats against them through control effects"
        });
    }
}

/**
 * Artifact Theft Combo
 * Detects artifact stealing and equipment manipulation
 */
function checkArtifactTheftCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const theftCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('steal') ||
            text.includes('artifact out of') ||
            text.includes('take') ||
            text.includes('snatch') ||
            text.includes('pick up') ||
            text.includes('borrow')) {
            theftCards.push(card.name || name);
        }
    });
    
    if (theftCards.length >= 1) {
        combos.push({
            name: "Artifact Theft",
            cards: theftCards,
            synergy: theftCards.length * 12,
            description: "Steals and manipulates enemy equipment and artifacts",
            strategy: "Disrupt enemy strategies by stealing their key artifacts"
        });
    }
}

/**
 * Cost Reduction Combo
 * Detects cost reduction effects and mana efficiency
 */
function checkCostReductionCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const costReductionCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        
        if (text.includes('for (1) less') ||
            text.includes('cost') ||
            text.includes('for (0)') ||
            text.includes('reduced') ||
            text.includes('cheaper') ||
            text.includes('discount')) {
            costReductionCards.push(card.name || name);
        }
    });
    
    if (costReductionCards.length >= 2) {
        combos.push({
            name: "Cost Reduction Engine",
            cards: costReductionCards,
            synergy: costReductionCards.length * 11,
            description: "Reduces casting costs for efficient resource usage",
            strategy: "Enable expensive cards earlier through cost reduction"
        });
    }
}

/**
 * Multi-Element Synergy Combo
 * Detects sites and cards that provide multiple elements
 */
function checkMultiElementSynergyCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const multiElementCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        const elements = card.elements || [];
        
        if (elements.length > 1 ||
            text.includes('aefw') ||
            text.includes('air;earth;fire;water') ||
            text.includes('all elements') ||
            text.includes('multi') ||
            text.includes('pristine paradise') ||
            text.includes('colour out of space')) {
            multiElementCards.push(card.name || name);
        }
    });
    
    if (multiElementCards.length >= 2) {
        combos.push({
            name: "Multi-Element Synergy",
            cards: multiElementCards,
            synergy: multiElementCards.length * 16,
            description: "Leverages multiple elemental sources for flexibility",
            strategy: "Build multi-color decks with strong fixing and splash options"
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
