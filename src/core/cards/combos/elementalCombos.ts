/**
 * Element-based combo detection functions
 */

import { Card } from '../../../types/Card';
import { Combo } from './types';

/**
 * Elemental Lock Combo
 * Detects cards that restrict opponent's elemental options
 */
export function checkElementalLockCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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

/**
 * Elemental Convergence Combo
 * Detects cards that benefit from multi-element strategies
 */
export function checkElementalConvergenceCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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

/**
 * Elemental Threshold Combo
 * Detects cards that synergize with element threshold mechanics
 */
export function checkElementalThresholdCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
 * Multi-Element Synergy Combo
 * Detects sites and cards that provide multiple elements
 */
export function checkMultiElementSynergyCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
 * Elemental Core Engine Combo
 * Specifically detects elemental cores and their synergies
 */
export function checkElementalCoreEngineCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const coreNames = [
        'amethyst core',
        'onyx core',
        'ruby core',
        'aquamarine core'
    ];
    
    const foundCores: string[] = [];
    
    coreNames.forEach(coreName => {
        if (cardNames.has(coreName.toLowerCase())) {
            const card = cardNames.get(coreName.toLowerCase());
            foundCores.push(card?.name || coreName);
        }
    });
    
    if (foundCores.length >= 2) {
        combos.push({
            name: "Elemental Core Engine",
            cards: foundCores,
            synergy: foundCores.length * 15,
            description: "Core artifacts that enhance elemental strategies",
            strategy: "Use cores to accelerate elemental play patterns and thresholds"
        });
    }
}
