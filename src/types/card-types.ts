/**
 * Card-specific type definitions for the simulator
 */

export type EffectType = 'damage' | 'heal' | 'draw' | 'move' | 'create' | 'destroy' | 'modify';
export type TargetType = 'player' | 'minion' | 'spell' | 'site' | 'position' | 'any';
export type ConditionType = 'controller' | 'opponent' | 'type' | 'subtype' | 'cost';

export interface CardEffect {
  type: EffectType;
  targets?: TargetType[];
  conditions?: ConditionType[];
}

// DEPRECATED: Use Card from './Card' instead
export type { Card } from './Card';
