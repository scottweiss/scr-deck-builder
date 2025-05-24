/**
 * Control-oriented combo detection functions
 */

import { Card } from '../../../types/Card';
import { Combo } from './types';

/**
 * Control Combo
 * Detects cards that form a control package
 */
export function checkControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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

/**
 * Disable and Sleep Control Combo
 * Detects disable effects, sleep mechanics, and control elements
 */
export function checkDisableControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
 * Immobilize Control Combo
 * Detects immobilization and movement restriction effects
 */
export function checkImmobilizeControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
export function checkMindControlCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
 * Aura Dispel Combo
 * Detects long-lasting auras with dispel conditions
 */
export function checkAuraDispelCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
            synergy: allCards.length * 12,
            description: "Manages powerful auras and provides selective dispel options",
            strategy: "Use auras for value while keeping dispel available for opponent's auras"
        });
    }
}

/**
 * Curse Effect Combo
 * Detects curse effects and avatar/player targeting
 */
export function checkCurseEffectCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
 * Transformation Combo
 * Detects creature transformation and morph effects
 */
export function checkTransformationCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
 * Magic Protection Package Combo
 * Detects magic immunity and protection effects
 */
export function checkMagicProtectionPackageCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const protectionCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        const cardName = (card.name || name).toLowerCase();
        
        if (cardName.includes('amulet of niniane') ||
            cardName.includes('niniane') ||
            cardName.includes('amulet') ||
            text.includes('magic immunity') ||
            text.includes('immune to magic') ||
            text.includes('protection') ||
            text.includes('ward') ||
            text.includes('resist') ||
            text.includes('deflect') ||
            text.includes('counter') ||
            text.includes('spell immunity')) {
            protectionCards.push(card.name || name);
        }
    });
    
    if (protectionCards.length >= 1) {
        combos.push({
            name: "Magic Protection Package",
            cards: protectionCards,
            synergy: protectionCards.length * 17,
            description: "Provides protection from magical effects and spells",
            strategy: "Use to counter spell-heavy control decks"
        });
    }
}
