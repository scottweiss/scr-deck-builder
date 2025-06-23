import { Card, Avatar, Site } from '../../types';

export interface CardInPlay extends Card {
  instanceId?: string;
  location: 'hand' | 'board' | 'graveyard' | 'spellbook' | 'sites';
  tapped?: boolean;
  summoningSickness?: boolean;
  damage?: number;
  modifiedAttack?: number;
  modifiedDefense?: number;
  modifiedHealth?: number;
}

export interface PlayerState {
  id: 1 | 2;
  avatar: Avatar;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  hand: CardInPlay[];
  board: CardInPlay[];
  sites: CardInPlay[];
  spellbook: CardInPlay[];
  graveyard: CardInPlay[];
  activeSite: Site | null;
  hasPlayedSite: boolean;
  spellsPlayedThisTurn: number;
}

export interface GameState {
  currentTurn: number;
  activePlayer: 1 | 2;
  phase: 'draw' | 'main' | 'combat' | 'end';
  player1: PlayerState;
  player2: PlayerState;
  turnTimer: number;
  lastAction: GameAction | null;
  winner: 1 | 2 | null;
}

export type ActionType = 
  | 'play_site'
  | 'play_card'
  | 'attack'
  | 'activate_ability'
  | 'end_turn'
  | 'mulligan';

export interface GameAction {
  type: ActionType;
  playerId: 1 | 2;
  cardId?: string;
  targetId?: string;
  attackerId?: string;
  abilityIndex?: number;
  timestamp: number;
  description?: string;
}
