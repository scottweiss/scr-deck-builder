/**
 * Card-specific type definitions for the simulator
 */

import { Card as CanonicalCard } from './Card';

export type EffectType = 'damage' | 'heal' | 'draw' | 'move' | 'create' | 'destroy' | 'modify';
export type TargetType = 'player' | 'minion' | 'spell' | 'site' | 'position' | 'any';
export type ConditionType = 'controller' | 'opponent' | 'type' | 'subtype' | 'cost';

export interface CardEffect {
  type: EffectType;
  targets?: TargetType[];
  conditions?: ConditionType[];
}

// Alias SimulationCard to canonical Card
type SimulationCard = CanonicalCard;
export type { SimulationCard };
