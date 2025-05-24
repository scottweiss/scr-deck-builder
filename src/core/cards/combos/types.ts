/**
 * Core types and interfaces for the card combo detection system
 */

import { Card } from '../../../types/Card';

/**
 * Represents a card combo with associated cards and synergy information
 */
export interface Combo {
    name: string;
    cards: string[];
    synergy: number;
    description: string;
    strategy?: string;
}

/**
 * Represents a match between a deck and an archetype
 */
export interface ArchetypeMatch {
    archetype: string;
    strength: number;
    cards: Card[];
    description: string;
}

/**
 * Function signature for combo detection functions
 */
export type ComboDetectionFunction = (cardNames: Map<string, Card>, combos: Combo[]) => void;
