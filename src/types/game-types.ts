/**
 * Game-specific type definitions for the simulator
 */

import { Card as CanonicalCard, Element, CardType } from './Card';

export interface Player {
  id: string;
  name: string;
  health: number;
  hand: {
    spells: CanonicalCard[];
  };
  battlefield: CanonicalCard[];
  deck: CanonicalCard[];
  graveyard: CanonicalCard[];
  manaPool: ManaPool;
  statistics: PlayerStatistics;
  continuousEffects: ContinuousEffect[];
  turnModifiers: TurnModifier[];
}

export interface ManaPool {
  red: number;
  blue: number;
  green: number;
  white: number;
  black: number;
  colorless: number;
}

export interface PlayerStatistics {
  damageDealt: number;
  damageTaken: number;
  cardsDrawn: number;
  spellsCast: number;
  creaturesPlayed: number;
  turnsPlayed: number;
}

export interface ContinuousEffect {
  id: string;
  source: CanonicalCard;
  type: string;
  duration: 'turn' | 'permanent' | 'until-removed';
  layerPriority: number;
}

export interface TurnModifier {
  type: string;
  value: number;
  duration: number;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayer: string;
  turnNumber: number;
  phase: string;
  board: (CanonicalCard | null)[][];
  stack?: any[];
  winner?: string;
  gameEnded: boolean;
}

export type EffectType = 'damage' | 'heal' | 'draw' | 'move' | 'create' | 'destroy' | 'modify';
export type TargetType = 'player' | 'minion' | 'spell' | 'site' | 'position' | 'any';
export type ConditionType = 'controller' | 'opponent' | 'type' | 'subtype' | 'cost';

export interface CardEffect {
  type: EffectType;
  targets?: TargetType[];
  conditions?: ConditionType[];
}
