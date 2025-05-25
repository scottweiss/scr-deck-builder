/**
 * Positional and movement-related combo detection functions
 */

import { Card } from '../../../types/Card';

import { Combo } from './types';

/**
 * Multi-Position Mastery Combo
 * Detects cards that control multiple positions
 */
export function checkMultiPositionMasteryCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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

/**
 * Underground Network Combo
 * Detects underground movement and tunneling abilities
 */
export function checkUndergroundNetworkCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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

/**
 * Water Dominance Engine Combo
 * Detects water-based positional control
 */
export function checkWaterDominanceEngineCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const waterDominanceCards = [
        "Water Dominance",
        "Flood Control",
        "Tidal Mastery",
        "Ocean Power"
    ];
    
    const foundCards: string[] = [];
    for (const cardName of waterDominanceCards) {
        if (cardNames.has(cardName.toLowerCase())) {
            foundCards.push(cardName);
        }
    }
    
    if (foundCards.length >= 2) {
        combos.push({
            name: "Water Dominance Engine",
            cards: foundCards,
            synergy: foundCards.length * 17,
            description: "Controls water-based positions and aquatic movement",
            strategy: "Dominate water sites and restrict enemy movement"
        });
    }
}

/**
 * Aerial Superiority Chamber Combo
 * Detects aerial and flying position control
 */
export function checkAerialSuperiorityChamberCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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

/**
 * Positional Control Combo
 * Detects cards that maintain strategic position control
 */
export function checkPositionalControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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

/**
 * Position Strategy Combo
 * Detects position-based effects and back row requirements
 */
export function checkPositionStrategyCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
 * Movement and Positioning Control Combo
 * Detects teleportation, movement manipulation, and positioning effects
 */
export function checkMovementControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
