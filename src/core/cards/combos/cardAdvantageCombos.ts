/**
 * Card advantage and recursion combo detection functions
 */

import { Card } from '../../../types/Card';

import { Combo } from './types';

/**
 * Recursion Combo
 * Detects card recursion and reuse effects
 */
export function checkRecursionCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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

/**
 * Voidwalk Resurrection Combo
 * Detects voidwalk creatures and resurrection synergies
 */
export function checkVoidwalkResurrectionCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
export function checkDeathriteSynergyCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
 * Spell-Triggered Value Engine Combo
 * Detects cards that trigger on spell casting for value
 */
export function checkSpellTriggeredValueEngineCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const triggerCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        const cardName = (card.name || name).toLowerCase();
        
        if (cardName.includes('ring of morrigan') ||
            cardName.includes('morrigan') ||
            cardName.includes('ring') ||
            text.includes('when bearer casts') ||
            text.includes('when you cast') ||
            text.includes('spell trigger') ||
            text.includes('triggered by') ||
            text.includes('whenever') ||
            text.includes('each time') ||
            (text.includes('cast') && (text.includes('gain') || text.includes('deal') || text.includes('draw')))) {
            triggerCards.push(card.name || name);
        }
    });
    
    if (triggerCards.length >= 1) {
        combos.push({
            name: "Spell-Triggered Value Engine",
            cards: triggerCards,
            synergy: triggerCards.length * 11,
            description: "Generates value whenever spells are cast",
            strategy: "Build around spell-heavy strategies for consistent value"
        });
    }
}
