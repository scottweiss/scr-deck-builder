/**
 * Action Stack system for Sorcery: Contested Realm
 * Part of Phase 1: Core Engine Foundation
 */

import { Position } from './gameState';

export type ActionType = 
  | 'cast_spell' | 'play_site' | 'move_unit' | 'attack' | 'activate_ability' 
  | 'intercept' | 'defend' | 'pass_priority' | 'end_phase' | 'triggered_ability';

export interface GameAction {
  id: string;
  type: ActionType;
  playerId: 'player1' | 'player2';
  timestamp: number;
  priority: number;
  
  // Action-specific data
  sourceId?: string; // Unit or card ID
  targetId?: string; // Target unit ID
  targetPosition?: Position;
  cardId?: string;
  abilityId?: string;
  
  // Additional parameters
  parameters?: { [key: string]: any };
  
  // Execution state
  isResolved: boolean;
  canBeCountered: boolean;
  fizzled: boolean;
  
  // Cost information
  manaCost?: number;
  elementalCost?: string[];
  additionalCosts?: ActionCost[];

  // Explanation or reasoning for the action
  reasoning?: string;
}

export interface ActionCost {
  type: 'sacrifice_unit' | 'discard_card' | 'pay_life' | 'tap_unit' | 'remove_counter';
  amount: number;
  target?: string;
}

export interface ActionResult {
  success: boolean;
  effects: ActionEffect[];
  triggeredAbilities: GameAction[];
  error?: string;
}

export interface ActionEffect {
  type: 'damage' | 'heal' | 'move' | 'destroy' | 'modify' | 'draw_card' | 'gain_mana';
  targetId?: string;
  value?: number;
  description: string;
}

export interface StackEntry {
  action: GameAction;
  controller: 'player1' | 'player2';
  responses: GameAction[];
  isCountered: boolean;
}

export interface PriorityState {
  activePlayer: 'player1' | 'player2';
  hasPassedThisRound: Set<'player1' | 'player2'>;
  pendingActions: GameAction[];
}

export class ActionStack {
  private stack: StackEntry[];
  private priorityState: PriorityState;
  private actionHistory: GameAction[];
  private nextActionId: number;

  constructor() {
    this.stack = [];
    this.actionHistory = [];
    this.nextActionId = 1;
    this.priorityState = {
      activePlayer: 'player1',
      hasPassedThisRound: new Set(),
      pendingActions: []
    };
  }

  /**
   * Add an action to the stack
   */
  public addAction(action: Omit<GameAction, 'id' | 'timestamp' | 'isResolved'>): string {
    const gameAction: GameAction = {
      ...action,
      id: `action_${this.nextActionId++}`,
      timestamp: Date.now(),
      isResolved: false
    };

    // Check if action can be added (timing restrictions, costs, etc.)
    if (!this.canAddAction(gameAction)) {
      throw new Error(`Cannot add action: ${action.type}`);
    }

    const stackEntry: StackEntry = {
      action: gameAction,
      controller: action.playerId,
      responses: [],
      isCountered: false
    };

    this.stack.push(stackEntry);
    this.priorityState.hasPassedThisRound.clear();
    
    // Give priority to the non-active player
    this.priorityState.activePlayer = action.playerId === 'player1' ? 'player2' : 'player1';

    return gameAction.id;
  }

  /**
   * Pass priority to the other player
   */
  public passPriority(playerId: 'player1' | 'player2'): boolean {
    if (this.priorityState.activePlayer !== playerId) {
      return false;
    }

    this.priorityState.hasPassedThisRound.add(playerId);
    
    // If both players have passed, resolve the stack
    if (this.priorityState.hasPassedThisRound.size === 2) {
      return this.resolveStack();
    }

    // Switch active player
    this.priorityState.activePlayer = playerId === 'player1' ? 'player2' : 'player1';
    return true;
  }

  /**
   * Counter an action on the stack
   */
  public counterAction(actionId: string, counterId: string): boolean {
    const stackEntry = this.stack.find(entry => entry.action.id === actionId);
    if (!stackEntry || !stackEntry.action.canBeCountered) {
      return false;
    }

    stackEntry.isCountered = true;
    return true;
  }

  /**
   * Resolve the entire stack
   */
  public resolveStack(): boolean {
    const results: ActionResult[] = [];

    // Resolve actions from top to bottom (last in, first out)
    while (this.stack.length > 0) {
      const entry = this.stack.pop()!;
      
      if (!entry.isCountered) {
        const result = this.resolveAction(entry.action);
        results.push(result);
        
        // Add any triggered abilities to the stack
        if (result.triggeredAbilities.length > 0) {
          for (const triggered of result.triggeredAbilities) {
            this.addAction(triggered);
          }
          
          // If new actions were added, restart priority
          if (this.stack.length > 0) {
            this.priorityState.hasPassedThisRound.clear();
            return false; // Stack not fully resolved
          }
        }
      }

      entry.action.isResolved = true;
      this.actionHistory.push(entry.action);
    }

    // Reset priority state
    this.priorityState.hasPassedThisRound.clear();
    return true;
  }

  /**
   * Resolve a single action
   */
  private resolveAction(action: GameAction): ActionResult {
    let result: ActionResult = {
      success: false,
      effects: [],
      triggeredAbilities: []
    };

    try {
      switch (action.type) {
        case 'cast_spell':
          result = this.resolveCastSpell(action);
          break;
        case 'play_site':
          result = this.resolvePlaySite(action);
          break;
        case 'move_unit':
          result = this.resolveMoveUnit(action);
          break;
        case 'attack':
          result = this.resolveAttack(action);
          break;
        case 'activate_ability':
          result = this.resolveActivateAbility(action);
          break;
        case 'intercept':
          result = this.resolveIntercept(action);
          break;
        case 'defend':
          result = this.resolveDefend(action);
          break;
        case 'triggered_ability':
          result = this.resolveTriggeredAbility(action);
          break;
        default:
          result.error = `Unknown action type: ${action.type}`;
      }
    } catch (error) {
      result.error = `Error resolving action: ${error}`;
    }

    return result;
  }

  /**
   * Check if an action can be added to the stack
   */
  private canAddAction(action: GameAction): boolean {
    // Check if it's the player's priority
    if (this.priorityState.activePlayer !== action.playerId && action.type !== 'triggered_ability') {
      return false;
    }

    // Check timing restrictions
    if (!this.isValidTiming(action)) {
      return false;
    }

    // Check costs can be paid
    if (!this.canPayCosts(action)) {
      return false;
    }

    return true;
  }

  /**
   * Check if timing is valid for an action
   */
  private isValidTiming(action: GameAction): boolean {
    // Implement timing rules based on action type
    switch (action.type) {
      case 'play_site':
        // Sites can only be played during main phase with empty stack
        return this.stack.length === 0;
      case 'cast_spell':
        // Most spells can be cast at any time
        return true;
      case 'move_unit':
      case 'attack':
        // Movement and attacks only during main phase with empty stack
        return this.stack.length === 0;
      case 'activate_ability':
        // Abilities follow their own timing rules
        return true;
      case 'intercept':
      case 'defend':
        // Only during combat
        return this.stack.some(entry => entry.action.type === 'attack');
      default:
        return true;
    }
  }

  /**
   * Check if player can pay the costs for an action
   */
  private canPayCosts(action: GameAction): boolean {
    // This would integrate with the player state manager to check costs
    // For now, assume costs can be paid
    return true;
  }

  // Action resolution methods (simplified implementations)

  private resolveCastSpell(action: GameAction): ActionResult {
    return {
      success: true,
      effects: [{
        type: 'damage',
        targetId: action.targetId,
        value: 3,
        description: `Spell cast on ${action.targetId}`
      }],
      triggeredAbilities: []
    };
  }

  private resolvePlaySite(action: GameAction): ActionResult {
    return {
      success: true,
      effects: [{
        type: 'gain_mana',
        value: 1,
        description: `Site played at ${action.targetPosition?.x},${action.targetPosition?.y}`
      }],
      triggeredAbilities: []
    };
  }

  private resolveMoveUnit(action: GameAction): ActionResult {
    return {
      success: true,
      effects: [{
        type: 'move',
        targetId: action.sourceId,
        description: `Unit ${action.sourceId} moved to ${action.targetPosition?.x},${action.targetPosition?.y}`
      }],
      triggeredAbilities: []
    };
  }

  private resolveAttack(action: GameAction): ActionResult {
    return {
      success: true,
      effects: [{
        type: 'damage',
        targetId: action.targetId,
        value: 2,
        description: `${action.sourceId} attacks ${action.targetId}`
      }],
      triggeredAbilities: []
    };
  }

  private resolveActivateAbility(action: GameAction): ActionResult {
    return {
      success: true,
      effects: [{
        type: 'modify',
        targetId: action.sourceId,
        description: `Ability ${action.abilityId} activated`
      }],
      triggeredAbilities: []
    };
  }

  private resolveIntercept(action: GameAction): ActionResult {
    return {
      success: true,
      effects: [{
        type: 'modify',
        description: `${action.sourceId} intercepts attack`
      }],
      triggeredAbilities: []
    };
  }

  private resolveDefend(action: GameAction): ActionResult {
    return {
      success: true,
      effects: [{
        type: 'modify',
        description: `${action.sourceId} defends`
      }],
      triggeredAbilities: []
    };
  }

  private resolveTriggeredAbility(action: GameAction): ActionResult {
    return {
      success: true,
      effects: [{
        type: 'modify',
        description: `Triggered ability: ${action.abilityId}`
      }],
      triggeredAbilities: []
    };
  }

  /**
   * Get the current state of the stack
   */
  public getStackState(): {
    stack: StackEntry[];
    activePlayer: 'player1' | 'player2';
    stackSize: number;
    topAction?: GameAction;
  } {
    return {
      stack: [...this.stack],
      activePlayer: this.priorityState.activePlayer,
      stackSize: this.stack.length,
      topAction: this.stack.length > 0 ? this.stack[this.stack.length - 1].action : undefined
    };
  }

  /**
   * Get action history
   */
  public getActionHistory(): GameAction[] {
    return [...this.actionHistory];
  }

  /**
   * Check if a player has priority
   */
  public hasPriority(playerId: 'player1' | 'player2'): boolean {
    return this.priorityState.activePlayer === playerId;
  }

  /**
   * Check if the stack is empty
   */
  public isEmpty(): boolean {
    return this.stack.length === 0;
  }

  /**
   * Set the active player (for game flow control)
   */
  public setActivePlayer(playerId: 'player1' | 'player2'): void {
    this.priorityState.activePlayer = playerId;
    this.priorityState.hasPassedThisRound.clear();
  }

  /**
   * Clear the stack (for emergency situations)
   */
  public clearStack(): void {
    this.stack = [];
    this.priorityState.hasPassedThisRound.clear();
  }

  /**
   * Add a triggered ability to the stack
   */
  public addTriggeredAbility(
    trigger: string,
    controller: 'player1' | 'player2',
    abilityId: string,
    sourceId: string
  ): string {
    return this.addAction({
      type: 'triggered_ability',
      playerId: controller,
      priority: 1000, // Triggered abilities have highest priority
      sourceId,
      abilityId,
      parameters: { trigger },
      canBeCountered: false,
      fizzled: false
    });
  }

  /**
   * Check if there are any pending responses
   */
  public hasPendingResponses(): boolean {
    return this.stack.some(entry => entry.responses.length > 0);
  }

  /**
   * Get valid actions for the current game state
   */
  public getValidActions(playerId: 'player1' | 'player2'): ActionType[] {
    if (!this.hasPriority(playerId)) {
      return [];
    }

    const actions: ActionType[] = ['pass_priority'];

    if (this.stack.length === 0) {
      // Main phase actions
      actions.push('cast_spell', 'play_site', 'move_unit', 'attack', 'activate_ability');
    } else {
      // Response actions
      actions.push('cast_spell', 'activate_ability');
      
      // Combat responses
      if (this.stack.some(entry => entry.action.type === 'attack')) {
        actions.push('intercept', 'defend');
      }
    }

    return actions;
  }

  /**
   * Reset the action stack for a new game
   */
  public reset(): void {
    this.stack = [];
    this.actionHistory = [];
    this.nextActionId = 1;
    this.priorityState = {
      activePlayer: 'player1',
      hasPassedThisRound: new Set(),
      pendingActions: []
    };
  }
}
