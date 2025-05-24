/**
 * Core type definitions for Sorcery: Contested Realm card game
 */

export enum Element {
  Water = 'Water',
  Fire = 'Fire',
  Earth = 'Earth',
  Air = 'Air',
  Void = 'Void'
}

export enum CardType {
  Minion = 'Minion',
  Magic = 'Magic',
  Artifact = 'Artifact',
  Aura = 'Aura',
  Site = 'Site',
  Avatar = 'Avatar',
  Unknown = 'Unknown'
}

export enum CardRarity {
  Ordinary = 'Ordinary',
  Exceptional = 'Exceptional',
  Elite = 'Elite',
  Unique = 'Unique',
  Common = 'Common'
}

export type CardSet = 'Beta' | 'ArthurianLegends';

export type CardSubtype = 'Mortal' | 'Beast' | 'Demon' | 'Spirit' | 'Undead' | 'Angel' | 
                         'Faerie' | 'Giant' | 'Gnome' | 'Dwarf' | 'Monster' | 'Relic' | 
                         'Armor' | 'Weapon' | 'Document' | 'Monument' | 'Instruments' | string;

/**
 * Raw card data structure as it comes from the CSV/processed data
 */
export interface RawCard {
  productId: string;
  name: string;
  cleanName: string;
  imageUrl: string;
  categoryId: string;
  groupId: string;
  url: string;
  modifiedOn: string;
  imageCount: string;
  extRarity: string;
  extDescription: string;
  extCost: string;
  extThreshold: string;
  extElement: string;
  extTypeLine: string;
  extCardCategory: string;
  extCardType: string;
  subTypeName: string;
  extPowerRating: string;
  extCardSubtype: string;
  extFlavorText: string;
  extDefensePower: string;
  extLife: string;
  setName: string;
}

/**
 * Processed card data with computed fields for easier usage
 */
export interface Card extends RawCard {
  type: CardType;
  mana_cost: number;
  text: string;
  elements: Element[];
  power: number;
  defense?: number;
  life?: number;
  rarity: CardRarity;
  baseName: string;
  cost: number;
  threshold?: string;
  subtype?: CardSubtype;
  // Parsed threshold requirements for spells (what's needed to cast)
  thresholdRequirements?: Record<string, number>;
  // Elemental affinity for sites (what's provided)
  elementalAffinity?: Record<string, number>;
  // Mana generation for sites
  manaGeneration?: number;
}

/**
 * Processed card with computed properties added
 */
export interface ProcessedCard extends RawCard {
  type: CardType;
  mana_cost: number;
  text: string;
  elements: Element[];
  power: number;
  rarity: CardRarity;
  baseName: string;
}

/**
 * Card mechanics analysis result
 */
export interface CardMechanics {
  // Region-specific mechanics
  operatesUnderground: boolean;
  operatesUnderwater: boolean;
  operatesVoid: boolean;
  
  // Combat mechanics
  dealsAOEDamage: boolean;
  drawsCards: boolean;
  dealsDirectDamage: boolean;
  producesResources: boolean;
  controlsMinions: boolean;
  enhancesMinions: boolean;
  triggersOnSpells: boolean;
  
  // Movement and positioning
  hasAirborne: boolean;
  hasBurrowing: boolean;
  hasCharge: boolean;
  supportsDefense: boolean;
  
  // Advanced combat
  hasStrikeFirst: boolean;
  hasLethal: boolean;
  hasInterceptAdvantage: boolean;
}

/**
 * Card allocation for deck building
 */
export interface CardAllocation {
  minions: number;
  artifacts: number;
  auras: number;
  magics: number;
}

/**
 * Card filtering options
 */
export interface CardFilter {
  element?: Element | Element[];
  type?: CardType | CardType[];
  rarity?: CardRarity | CardRarity[];
  set?: CardSet | CardSet[];
  minCost?: number;
  maxCost?: number;
  hasText?: string;
}

/**
 * Card statistics
 */
export interface CardStats {
  total: number;
  byType: Record<CardType, number>;
  byElement: Record<Element, number>;
  byRarity: Record<CardRarity, number>;
  bySet: Record<CardSet, number>;
  averageCost: number;
}
