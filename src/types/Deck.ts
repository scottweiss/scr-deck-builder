/**
 * Type definitions for deck building and deck management
 */

import { Card, Element, CardAllocation } from './Card';

/**
 * Deck validation result
 */
export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalCards: number;
  spellbookSize: number;
  siteCount: number;
}

/**
 * Deck building options
 */
export interface DeckBuildOptions {
  minions: Card[];
  artifacts: Card[];
  auras: Card[];
  magics: Card[];
  sites?: Card[];
  uniqueCards: Card[];
  avatar?: Card;
  allocation?: CardAllocation;
  preferredElement?: Element;
  preferredArchetype?: string;
  maxCards?: number;
  enforceRules?: boolean;
}

/**
 * Deck composition
 */
export interface Deck {
  avatar?: Card;
  spellbook: Card[];
  sites: Card[];
  metadata: DeckMetadata;
}

/**
 * Deck metadata
 */
export interface DeckMetadata {
  name?: string;
  description?: string;
  author?: string;
  createdAt: Date;
  modifiedAt?: Date;
  version?: string;
  tags?: string[];
  gameFormat?: string;
  totalSynergy: number;
  playabilityScore: number;
}

/**
 * Deck statistics
 */
export interface DeckStatistics {
  totalCards: number;
  spellbookSize: number;
  siteCount: number;
  averageCost: number;
  elementDistribution: Record<Element, number>;
  typeDistribution: Record<string, number>;
  rarityDistribution: Record<string, number>;
  costCurve: Record<number, number>;
  synergyScore: number;
  playabilityScore: number;
}

/**
 * Card combination for synergy analysis
 */
export interface CardCombo {
  name: string;
  description: string;
  pieces: ComboCard[];
  synergisticScore: number;
  percentComplete: number;
  requiredElements: Element[];
  totalCost: number;
}

/**
 * Card in a combo with analysis
 */
export interface ComboCard {
  card: Card;
  role: string;
  importance: number;
  synergies: string[];
}

/**
 * Deck optimization result
 */
export interface OptimizationResult {
  originalDeck: Card[];
  optimizedDeck: Card[];
  improvements: string[];
  scoreImprovement: number;
  removedCards: Card[];
  addedCards: Card[];
}

/**
 * Deck export options
 */
export interface DeckExportOptions {
  format: 'json' | 'text' | 'csv' | 'tts';
  includeMetadata: boolean;
  includeStats: boolean;
  groupByType: boolean;
  sortOrder: 'name' | 'cost' | 'type' | 'element';
}

/**
 * Playability analysis result
 */
export interface PlayabilityAnalysis {
  score: number;
  factors: PlayabilityFactor[];
  recommendations: string[];
  elementBalance: Record<Element, number>;
  costBalance: Record<number, number>;
  typeBalance: Record<string, number>;
}

/**
 * Individual playability factor
 */
export interface PlayabilityFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}
