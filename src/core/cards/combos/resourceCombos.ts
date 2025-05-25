/**
 * Resource-based combo detection functions
 */

import { Card } from '../../../types/Card';

import { Combo } from './types';

/**
 * Mana Acceleration Combo
 * Detects mana ramp and acceleration effects
 */
export function checkManaAccelerationCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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

/**
 * Cost Reduction Combo
 * Detects cost reduction effects and mana efficiency
 */
export function checkCostReductionCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
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
 * Mana/Threshold Accelerator Combo
 * Detects cards that provide both mana and threshold acceleration
 */
export function checkManaThresholdAcceleratorCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const acceleratorCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        const cardName = (card.name || name).toLowerCase();
        
        if (cardName.includes('amethyst core') ||
            cardName.includes('onyx core') ||
            cardName.includes('ruby core') ||
            cardName.includes('aquamarine core') ||
            text.includes('mana') ||
            text.includes('threshold') ||
            text.includes('element') ||
            text.includes('acceleration')) {
            acceleratorCards.push(card.name || name);
        }
    });
    
    if (acceleratorCards.length >= 2) {
        combos.push({
            name: "Mana/Threshold Acceleration Engine",
            cards: acceleratorCards,
            synergy: acceleratorCards.length * 14,
            description: "Provides both mana fixing and threshold acceleration for consistent plays",
            strategy: "Include to enable multi-element strategies and expensive threats"
        });
    }
}

/**
 * Spell Cost Reduction Engine Combo
 * Detects advanced spell cost reduction synergies
 */
export function checkSpellCostReductionEngineCombo(cardNames: Map<string, Card>, combos: Combo[]): void {
    const costReductionCards: string[] = [];
    
    cardNames.forEach((card, name) => {
        const text = (card.text || '').toLowerCase();
        const cardName = (card.name || name).toLowerCase();
        
        if (cardName.includes('philosopher\'s stone') ||
            cardName.includes('stone') ||
            text.includes('spells cost') ||
            text.includes('cost (1) less') ||
            text.includes('reduce') ||
            text.includes('discount') ||
            text.includes('cheaper') ||
            text.includes('per element') ||
            (text.includes('cost') && (text.includes('less') || text.includes('reduction')))) {
            costReductionCards.push(card.name || name);
        }
    });
    
    if (costReductionCards.length >= 2) {
        combos.push({
            name: "Spell Cost Reduction Engine",
            cards: costReductionCards,
            synergy: costReductionCards.length * 13,
            description: "Reduces spell costs for efficient resource usage and powerful turns",
            strategy: "Build around expensive spells and high-impact effects"
        });
    }
}
