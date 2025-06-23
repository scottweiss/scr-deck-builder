/**
 * Core type definitions for Sorcery: Contested Realm card game
 */

export enum CardType {
  Avatar = 'Avatar',
  Site = 'Site',
  Minion = 'Minion',
  Magic = 'Magic',
  Artifact = 'Artifact',
  Aura = 'Aura'
}

export enum Element {
  Water = 'Water',
  Fire = 'Fire',
  Earth = 'Earth',
  Air = 'Air',
  Void = 'Void'
}

export enum CardRarity {
  Ordinary = 'Ordinary',
  Exceptional = 'Exceptional',
  Elite = 'Elite',
  Unique = 'Unique'
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  elements: Element[];
  mana_cost: number;
  text?: string;
  rule_text?: string;
  power?: number;
  defense?: number;
  life?: number;
  rarity: CardRarity;
  set?: string;
  threshold?: { [key in Element]?: number };
  subtype?: string;
  image_url?: string;
}

export interface Avatar extends Card {
  type: CardType.Avatar;
  life: number;
}

export interface Site extends Card {
  type: CardType.Site;
  mana_generation?: number;
}

export interface Minion extends Card {
  type: CardType.Minion;
  power: number;
  defense: number;
}

export interface Magic extends Card {
  type: CardType.Magic;
}

export interface Artifact extends Card {
  type: CardType.Artifact;
}

export interface Aura extends Card {
  type: CardType.Aura;
}
