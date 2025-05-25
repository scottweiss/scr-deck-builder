/**
 * Card-specific type definitions for the simulator
 */

export type EffectType = 'damage' | 'heal' | 'draw' | 'move' | 'create' | 'destroy' | 'modify';
export type TargetType = 'player' | 'creature' | 'spell' | 'site' | 'position' | 'any';
export type ConditionType = 'controller' | 'opponent' | 'type' | 'subtype' | 'cost';

export interface CardEffect {
  type: EffectType;
  targets?: TargetType[];
  conditions?: ConditionType[];
}

export interface Card {
  id: string;
  name: string;
  type: 'Creature' | 'Instant' | 'Sorcery' | 'Enchantment' | 'Artifact' | 'Site' | 'Avatar';
  cost?: number;
  effect?: string;
  keywords?: string[];
  subtypes?: string[];
  power?: number; // Optional property for card's power
  life?: number;  // Optional property for card's life
  elements?: string[]; // Optional property for elemental symbols
}
