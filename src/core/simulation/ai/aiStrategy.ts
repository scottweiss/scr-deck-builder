// aiStrategy.ts
// Defines the interface and base for AI strategies in Sorcery TCG

import { GameState, Player, GameAction } from '../core/gameState';

export interface AIStrategy {
  evaluateGameState(gameState: GameState, player: Player): number;
  generateActions(gameState: GameState, player: Player): GameAction[];
  selectAction(actions: GameAction[], gameState: GameState, player: Player): GameAction | null;
  readonly name: string;
}

export abstract class BaseAIStrategy implements AIStrategy {
  abstract name: string;

  abstract evaluateGameState(gameState: GameState, player: Player): number;

  abstract generateActions(gameState: GameState, player: Player): GameAction[];

  selectAction(actions: GameAction[], gameState: GameState, player: Player): GameAction | null {
    // Default: pick the highest-evaluated action
    if (actions.length === 0) return null;
    return actions[0];
  }
}
