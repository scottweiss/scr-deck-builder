/**
 * TypeScript declarations for sorceryCards.js
 */

import { RawCard } from '../../types/Card';

export declare const SORCERY_CARDS: RawCard[];
export declare function getCardCount(): number;
export declare function getBetaCards(): RawCard[];
export declare function getArthurianCards(): RawCard[];
export declare function getCardsBySet(setName: string): RawCard[];
export declare function getAllCards(): RawCard[];
