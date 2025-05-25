// actionEvaluator.ts
// Utility for evaluating and scoring possible actions for AI

import { GameState, Player } from '../core/gameState';
import { GameAction } from '../core/gameState';

export class ActionEvaluator {
  static scoreAction(action: GameAction, gameState: GameState, player: Player): number {
    // Placeholder: score based on action type, can be expanded
    switch (action.type) {
      case 'ATTACK':
        return 10;
      case 'PLAY_CARD':
        return 8;
      case 'MOVE':
        return 6;
      default:
        return 1;
    }
  }

  static rankActions(actions: GameAction[], gameState: GameState, player: Player): GameAction[] {
    return actions.slice().sort((a, b) =>
      ActionEvaluator.scoreAction(b, gameState, player) - ActionEvaluator.scoreAction(a, gameState, player)
    );
  }
}
