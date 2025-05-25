/**
 * Priority System for Sorcery: Contested Realm
 * Part of Phase 1: Core Engine Foundation
 */

import { ActionStack } from './actionStack';
import { GameState } from './gameState';

export type GamePhaseType = 'start' | 'main' | 'combat' | 'end';
export type TurnStep = 
  | 'untap' | 'mana_generation' | 'triggered_abilities' | 'draw'
  | 'main_action' | 'declare_attacks' | 'intercept_defend' | 'combat_damage' 
  | 'end_cleanup';

export interface PhaseState {
  type: GamePhaseType;
  step: TurnStep;
  activePlayer: 'player1' | 'player2';
  priorityPlayer: 'player1' | 'player2';
  stepComplete: boolean;
  canPass: boolean;
}

export interface TurnStructure {
  phases: PhaseDefinition[];
  currentPhaseIndex: number;
  passCount: number;
}

export interface PhaseDefinition {
  type: GamePhaseType;
  steps: StepDefinition[];
  allowsActions: boolean;
  canBeSkipped: boolean;
}

export interface StepDefinition {
  step: TurnStep;
  isAutomatic: boolean;
  requiresPriority: boolean;
  allowedActions: string[];
  timeLimit?: number; // in seconds
}

export interface PriorityWindow {
  player: 'player1' | 'player2';
  canAct: boolean;
  mustAct: boolean;
  timeRemaining?: number;
  availableActions: string[];
}

export class PrioritySystem {
  private phaseState: PhaseState;
  private turnStructure: TurnStructure;
  private actionStack: ActionStack;
  private passedPlayers: Set<'player1' | 'player2'>;
  private phaseHistory: PhaseState[];

  constructor(actionStack: ActionStack) {
    this.actionStack = actionStack;
    this.phaseHistory = [];
    this.passedPlayers = new Set();
    
    this.turnStructure = this.getDefaultTurnStructure();
    this.phaseState = {
      type: 'start',
      step: 'untap',
      activePlayer: 'player1',
      priorityPlayer: 'player1',
      stepComplete: false,
      canPass: true
    };
  }

  /**
   * Get the default turn structure for Sorcery: Contested Realm
   */
  private getDefaultTurnStructure(): TurnStructure {
    return {
      currentPhaseIndex: 0,
      passCount: 0,
      phases: [
        {
          type: 'start',
          allowsActions: false,
          canBeSkipped: false,
          steps: [
            {
              step: 'untap',
              isAutomatic: true,
              requiresPriority: false,
              allowedActions: []
            },
            {
              step: 'mana_generation',
              isAutomatic: true,
              requiresPriority: false,
              allowedActions: []
            },
            {
              step: 'triggered_abilities',
              isAutomatic: false,
              requiresPriority: true,
              allowedActions: ['activate_ability', 'cast_spell']
            },
            {
              step: 'draw',
              isAutomatic: false,
              requiresPriority: true,
              allowedActions: ['draw_card']
            }
          ]
        },
        {
          type: 'main',
          allowsActions: true,
          canBeSkipped: false,
          steps: [
            {
              step: 'main_action',
              isAutomatic: false,
              requiresPriority: true,
              allowedActions: [
                'cast_spell', 'play_site', 'move_unit', 'activate_ability'
              ]
            }
          ]
        },
        {
          type: 'combat',
          allowsActions: true,
          canBeSkipped: true,
          steps: [
            {
              step: 'declare_attacks',
              isAutomatic: false,
              requiresPriority: true,
              allowedActions: ['attack', 'activate_ability', 'cast_spell']
            },
            {
              step: 'intercept_defend',
              isAutomatic: false,
              requiresPriority: true,
              allowedActions: ['intercept', 'defend', 'activate_ability', 'cast_spell']
            },
            {
              step: 'combat_damage',
              isAutomatic: true,
              requiresPriority: true,
              allowedActions: ['activate_ability', 'cast_spell']
            }
          ]
        },
        {
          type: 'end',
          allowsActions: false,
          canBeSkipped: false,
          steps: [
            {
              step: 'end_cleanup',
              isAutomatic: true,
              requiresPriority: false,
              allowedActions: []
            }
          ]
        }
      ]
    };
  }

  /**
   * Get the current phase state
   */
  public getCurrentPhase(): PhaseState {
    return { ...this.phaseState };
  }

  /**
   * Get the current priority window
   */
  public getPriorityWindow(): PriorityWindow {
    const currentPhase = this.turnStructure.phases[this.turnStructure.currentPhaseIndex];
    const currentStep = currentPhase.steps.find(s => s.step === this.phaseState.step);
    
    return {
      player: this.phaseState.priorityPlayer,
      canAct: currentStep?.requiresPriority || false,
      mustAct: !this.phaseState.canPass,
      availableActions: currentStep?.allowedActions || []
    };
  }

  /**
   * Pass priority to the next player
   */
  public passPriority(playerId: 'player1' | 'player2'): boolean {
    if (this.phaseState.priorityPlayer !== playerId) {
      return false;
    }

    this.passedPlayers.add(playerId);
    
    // If both players have passed, move to next step
    if (this.passedPlayers.size === 2) {
      return this.advanceStep();
    }

    // Switch priority to other player
    this.phaseState.priorityPlayer = playerId === 'player1' ? 'player2' : 'player1';
    return true;
  }

  /**
   * Advance to the next step in the current phase
   */
  public advanceStep(): boolean {
    const currentPhase = this.turnStructure.phases[this.turnStructure.currentPhaseIndex];
    const currentStepIndex = currentPhase.steps.findIndex(s => s.step === this.phaseState.step);
    
    if (currentStepIndex < currentPhase.steps.length - 1) {
      // Move to next step in same phase
      const nextStep = currentPhase.steps[currentStepIndex + 1];
      this.phaseState.step = nextStep.step;
      this.phaseState.stepComplete = false;
      this.resetPriority();
      return true;
    } else {
      // Move to next phase
      return this.advancePhase();
    }
  }

  /**
   * Advance to the next phase
   */
  public advancePhase(): boolean {
    this.phaseHistory.push({ ...this.phaseState });
    
    if (this.turnStructure.currentPhaseIndex < this.turnStructure.phases.length - 1) {
      // Move to next phase
      this.turnStructure.currentPhaseIndex++;
      const nextPhase = this.turnStructure.phases[this.turnStructure.currentPhaseIndex];
      
      this.phaseState.type = nextPhase.type;
      this.phaseState.step = nextPhase.steps[0].step;
      this.phaseState.stepComplete = false;
      this.resetPriority();
      
      return true;
    } else {
      // End of turn
      return this.endTurn();
    }
  }

  /**
   * End the current turn and start the next
   */
  public endTurn(): boolean {
    // Switch active player
    this.phaseState.activePlayer = this.phaseState.activePlayer === 'player1' ? 'player2' : 'player1';
    
    // Reset to start phase
    this.turnStructure.currentPhaseIndex = 0;
    const startPhase = this.turnStructure.phases[0];
    
    this.phaseState.type = startPhase.type;
    this.phaseState.step = startPhase.steps[0].step;
    this.phaseState.priorityPlayer = this.phaseState.activePlayer;
    this.phaseState.stepComplete = false;
    
    this.resetPriority();
    
    return true;
  }

  /**
   * Reset priority state
   */
  private resetPriority(): void {
    this.passedPlayers.clear();
    this.phaseState.priorityPlayer = this.phaseState.activePlayer;
    this.phaseState.canPass = true;
  }

  /**
   * Check if a player can take an action
   */
  public canTakeAction(playerId: 'player1' | 'player2', actionType: string): boolean {
    if (this.phaseState.priorityPlayer !== playerId) {
      return false;
    }

    const window = this.getPriorityWindow();
    return window.canAct && window.availableActions.includes(actionType);
  }

  /**
   * Process an action and update priority
   */
  public processAction(playerId: 'player1' | 'player2', actionType: string): boolean {
    if (!this.canTakeAction(playerId, actionType)) {
      return false;
    }

    // Reset pass count when action is taken
    this.passedPlayers.clear();
    
    // Give priority to opponent after action
    this.phaseState.priorityPlayer = playerId === 'player1' ? 'player2' : 'player1';
    
    return true;
  }

  /**
   * Skip to a specific phase (if allowed)
   */
  public skipToPhase(phaseType: GamePhaseType): boolean {
    const phaseIndex = this.turnStructure.phases.findIndex(p => p.type === phaseType);
    if (phaseIndex < 0 || phaseIndex <= this.turnStructure.currentPhaseIndex) {
      return false;
    }

    const targetPhase = this.turnStructure.phases[phaseIndex];
    if (!targetPhase.canBeSkipped) {
      return false;
    }

    this.turnStructure.currentPhaseIndex = phaseIndex;
    this.phaseState.type = targetPhase.type;
    this.phaseState.step = targetPhase.steps[0].step;
    this.resetPriority();

    return true;
  }

  /**
   * Force phase advancement (for automatic steps)
   */
  public forceAdvance(): boolean {
    const currentPhase = this.turnStructure.phases[this.turnStructure.currentPhaseIndex];
    const currentStep = currentPhase.steps.find(s => s.step === this.phaseState.step);
    
    if (currentStep?.isAutomatic) {
      return this.advanceStep();
    }

    return false;
  }

  /**
   * Check if the current step is complete
   */
  public isStepComplete(): boolean {
    return this.phaseState.stepComplete;
  }

  /**
   * Mark the current step as complete
   */
  public markStepComplete(): void {
    this.phaseState.stepComplete = true;
  }

  /**
   * Get the phase history
   */
  public getPhaseHistory(): PhaseState[] {
    return [...this.phaseHistory];
  }

  /**
   * Check if we're in a specific phase
   */
  public isInPhase(phaseType: GamePhaseType): boolean {
    return this.phaseState.type === phaseType;
  }

  /**
   * Check if we're in a specific step
   */
  public isInStep(step: TurnStep): boolean {
    return this.phaseState.step === step;
  }

  /**
   * Get time limit for current step (if any)
   */
  public getStepTimeLimit(): number | undefined {
    const currentPhase = this.turnStructure.phases[this.turnStructure.currentPhaseIndex];
    const currentStep = currentPhase.steps.find(s => s.step === this.phaseState.step);
    return currentStep?.timeLimit;
  }

  /**
   * Handle stack resolution in priority system
   */
  public handleStackResolution(): boolean {
    if (!this.actionStack.isEmpty()) {
      // While stack is resolving, only allow responses
      const resolved = this.actionStack.resolveStack();
      if (resolved) {
        // Stack fully resolved, return priority to active player
        this.phaseState.priorityPlayer = this.phaseState.activePlayer;
        this.passedPlayers.clear();
      }
      return resolved;
    }
    return true;
  }

  /**
   * Check if combat phase should be skipped
   */
  public shouldSkipCombat(): boolean {
    // Skip combat if no attacking units or no valid targets
    // This would be determined by game state analysis
    return false;
  }

  /**
   * Set up priority for a new game
   */
  public initializeGame(firstPlayer: 'player1' | 'player2'): void {
    this.phaseState = {
      type: 'start',
      step: 'untap',
      activePlayer: firstPlayer,
      priorityPlayer: firstPlayer,
      stepComplete: false,
      canPass: true
    };
    
    this.turnStructure.currentPhaseIndex = 0;
    this.resetPriority();
    this.phaseHistory = [];
  }

  /**
   * Get turn summary for debugging/logging
   */
  public getTurnSummary(): {
    turn: number;
    activePlayer: 'player1' | 'player2';
    currentPhase: GamePhaseType;
    currentStep: TurnStep;
    priorityPlayer: 'player1' | 'player2';
    stackSize: number;
  } {
    return {
      turn: this.phaseHistory.length + 1,
      activePlayer: this.phaseState.activePlayer,
      currentPhase: this.phaseState.type,
      currentStep: this.phaseState.step,
      priorityPlayer: this.phaseState.priorityPlayer,
      stackSize: this.actionStack.getStackState().stackSize
    };
  }

  /**
   * Reset the priority system for a new game
   */
  public reset(): void {
    this.turnStructure = this.getDefaultTurnStructure();
    this.phaseHistory = [];
    this.passedPlayers.clear();
    this.phaseState = {
      type: 'start',
      step: 'untap',
      activePlayer: 'player1',
      priorityPlayer: 'player1',
      stepComplete: false,
      canPass: true
    };
  }
}
