/**
 * Effect Parser for Sorcery TCG
 * Handles parsing and execution of card effects with proper timing and resolution
 */

import { Card, TargetType, CardType } from '../../../types/Card';
import { CardEffect, EffectType, ConditionType } from '../../../types/card-types';
import { GameState, Player } from '../core/gameState'; // <-- Use canonical types from simulation core
import { TargetingSystem } from './targetingSystem';

export interface ParsedEffect {
  id: string;
  sourceCard: Card;
  type: EffectType;
  targets: TargetType[];
  conditions: ConditionType[];
  cost?: {
    mana?: number;
    life?: number;
    discard?: number;
    sacrifice?: string[];
  };
  duration?: 'instant' | 'turn' | 'permanent' | 'until-removed';
  timing: 'instant' | 'sorcery' | 'triggered' | 'activated';
  priority: number;
  replacementEffect?: boolean;
  staticEffect?: boolean;
}

export interface EffectExecution {
  effect: ParsedEffect;
  targets: any[];
  result: EffectResult;
  timestamp: number;
}

export interface EffectResult {
  success: boolean;
  changes: StateChange[];
  triggers: ParsedEffect[];
  errors?: string[];
}

export interface StateChange {
  type: 'damage' | 'heal' | 'draw' | 'discard' | 'move' | 'create' | 'destroy' | 'modify';
  target: string;
  value?: number;
  data?: any;
}

export class EffectParser {
  private targetingSystem: TargetingSystem;
  private executionHistory: EffectExecution[] = [];
  private continuousEffects: ParsedEffect[] = [];
  private replacementEffects: ParsedEffect[] = [];

  constructor(targetingSystem: TargetingSystem) {
    this.targetingSystem = targetingSystem;
  }

  /**
   * Parse a card's effects into executable format
   */
  parseCardEffects(card: Card): ParsedEffect[] {
    const effects: ParsedEffect[] = [];
    
    if (!card.effect) return effects;

    // Parse different types of effects based on card text
    const effectText = card.effect.toLowerCase();
    
    // Parse direct damage effects
    if (effectText.includes('damage')) {
      effects.push(this.parseDamageEffect(card));
    }
    
    // Parse healing effects
    if (effectText.includes('heal') || effectText.includes('restore')) {
      effects.push(this.parseHealingEffect(card));
    }
    
    // Parse card draw effects
    if (effectText.includes('draw')) {
      effects.push(this.parseDrawEffect(card));
    }
    
    // Parse movement effects
    if (effectText.includes('move') || effectText.includes('teleport')) {
      effects.push(this.parseMovementEffect(card));
    }
    
    // Parse continuous effects
    if (effectText.includes('while') || effectText.includes('as long as')) {
      effects.push(this.parseContinuousEffect(card));
    }
    
    // Parse triggered effects
    if (effectText.includes('when') || effectText.includes('whenever')) {
      effects.push(this.parseTriggeredEffect(card));
    }

    return effects;
  }

  /**
   * Execute a parsed effect with proper targeting and timing
   */
  async executeEffect(
    effect: ParsedEffect, 
    gameState: GameState, 
    controller: Player,
    chosenTargets?: any[]
  ): Promise<EffectResult> {
    const execution: EffectExecution = {
      effect,
      targets: chosenTargets || [],
      result: { success: false, changes: [], triggers: [] },
      timestamp: Date.now()
    };

    try {
      // Validate targeting if targets are required
      if (effect.targets.length > 0 && !chosenTargets) {
        const validTargets = await this.targetingSystem.getValidTargets(
          effect.targets,
          gameState,
          controller,
          effect.sourceCard
        );
        
        if (validTargets.length === 0) {
          execution.result.errors = ['No valid targets available'];
          return execution.result;
        }
        
        // For AI or automatic targeting, select the first valid target
        execution.targets = [validTargets[0]];
      }

      // Check conditions
      if (!this.checkConditions(effect.conditions, gameState, controller)) {
        execution.result.errors = ['Effect conditions not met'];
        return execution.result;
      }

      // Execute the effect based on its type
      execution.result = await this.executeEffectByType(effect, gameState, controller, execution.targets);
      
      // Track continuous effects
      if (effect.duration !== 'instant') {
        this.continuousEffects.push(effect);
      }
      
      this.executionHistory.push(execution);
      
    } catch (error) {
      execution.result.errors = [`Effect execution failed: ${error}`];
    }

    return execution.result;
  }

  /**
   * Execute effect based on its specific type
   */
  private async executeEffectByType(
    effect: ParsedEffect,
    gameState: GameState,
    controller: Player,
    targets: any[]
  ): Promise<EffectResult> {
    const result: EffectResult = {
      success: true,
      changes: [],
      triggers: []
    };

    switch (effect.type) {
      case 'damage':
        result.changes.push(...this.executeDamage(effect, targets));
        break;
        
      case 'heal':
        result.changes.push(...this.executeHealing(effect, targets));
        break;
        
      case 'draw':
        result.changes.push(...this.executeCardDraw(effect, controller));
        break;
        
      case 'move':
        result.changes.push(...this.executeMovement(effect, targets, gameState));
        break;
        
      case 'create':
        result.changes.push(...this.executeCreation(effect, controller, gameState));
        break;
        
      case 'destroy':
        result.changes.push(...this.executeDestruction(effect, targets));
        break;
        
      case 'modify':
        result.changes.push(...this.executeModification(effect, targets));
        break;
        
      default:
        result.success = false;
        result.errors = [`Unknown effect type: ${effect.type}`];
    }

    return result;
  }

  /**
   * Parse damage effects from card text
   */
  private parseDamageEffect(card: Card): ParsedEffect {
    const effectText = card.effect?.toLowerCase() || '';
    
    // Extract damage amount (look for numbers followed by "damage")
    const damageMatch = effectText.match(/(\d+)\s*damage/);
    const amount = damageMatch ? parseInt(damageMatch[1]) : 1;
    
    // Determine targeting
    let targets: TargetType[] = [];
    if (effectText.includes('target')) {
      if (effectText.includes('minion')) {
        targets = ['minion'];
      } else if (effectText.includes('player')) {
        targets = ['player'];
      } else {
        targets = ['any'];
      }
    }

    return {
      id: `${card.id}-damage`,
      sourceCard: card,
      type: 'damage',
      targets,
      conditions: [],
      timing: card.type === CardType.Magic ? 'instant' : 'sorcery',
      priority: 1,
      duration: 'instant'
    };
  }

  /**
   * Parse healing effects from card text
   */
  private parseHealingEffect(card: Card): ParsedEffect {
    const effectText = card.effect?.toLowerCase() || '';
    
    return {
      id: `${card.id}-heal`,
      sourceCard: card,
      type: 'heal',
      targets: effectText.includes('target') ? ['minion', 'player'] : [],
      conditions: [],
      timing: card.type === CardType.Magic ? 'instant' : 'sorcery',
      priority: 1,
      duration: 'instant'
    };
  }

  /**
   * Parse card draw effects
   */
  private parseDrawEffect(card: Card): ParsedEffect {
    return {
      id: `${card.id}-draw`,
      sourceCard: card,
      type: 'draw',
      targets: [],
      conditions: [],
      timing: 'sorcery',
      priority: 1,
      duration: 'instant'
    };
  }

  /**
   * Parse movement effects
   */
  private parseMovementEffect(card: Card): ParsedEffect {
    return {
      id: `${card.id}-move`,
      sourceCard: card,
      type: 'move',
      targets: ['minion'],
      conditions: [],
      timing: card.type === CardType.Magic ? 'instant' : 'sorcery',
      priority: 1,
      duration: 'instant'
    };
  }

  /**
   * Parse continuous effects
   */
  private parseContinuousEffect(card: Card): ParsedEffect {
    return {
      id: `${card.id}-continuous`,
      sourceCard: card,
      type: 'modify',
      targets: [],
      conditions: [],
      timing: 'triggered',
      priority: 3,
      duration: 'permanent',
      staticEffect: true
    };
  }

  /**
   * Parse triggered effects
   */
  private parseTriggeredEffect(card: Card): ParsedEffect {
    return {
      id: `${card.id}-triggered`,
      sourceCard: card,
      type: 'modify',
      targets: [],
      conditions: [],
      timing: 'triggered',
      priority: 2,
      duration: 'instant'
    };
  }

  /**
   * Check if effect conditions are met
   */
  private checkConditions(
    conditions: ConditionType[],
    gameState: GameState,
    controller: Player
  ): boolean {
    // For now, assume all conditions are met
    // This would be expanded to check specific game state conditions
    return true;
  }

  /**
   * Execute damage effects
   */
  private executeDamage(effect: ParsedEffect, targets: any[]): StateChange[] {
    const changes: StateChange[] = [];
    
    // Extract damage amount from effect (simplified)
    const amount = 1; // Would be parsed from effect text
    
    targets.forEach(target => {
      changes.push({
        type: 'damage',
        target: target.id || target.name,
        value: amount
      });
    });
    
    return changes;
  }

  /**
   * Execute healing effects
   */
  private executeHealing(effect: ParsedEffect, targets: any[]): StateChange[] {
    const changes: StateChange[] = [];
    
    const amount = 1; // Would be parsed from effect text
    
    targets.forEach(target => {
      changes.push({
        type: 'heal',
        target: target.id || target.name,
        value: amount
      });
    });
    
    return changes;
  }

  /**
   * Execute card draw effects
   */
  private executeCardDraw(effect: ParsedEffect, controller: Player): StateChange[] {
    const amount = 1; // Would be parsed from effect text
    
    return [{
      type: 'draw',
      target: controller.id,
      value: amount
    }];
  }

  /**
   * Execute movement effects
   */
  private executeMovement(effect: ParsedEffect, targets: any[], gameState: GameState): StateChange[] {
    const changes: StateChange[] = [];
    
    // Movement logic would be implemented here
    targets.forEach(target => {
      changes.push({
        type: 'move',
        target: target.id,
        data: { /* movement data */ }
      });
    });
    
    return changes;
  }

  /**
   * Execute creation effects (tokens, etc.)
   */
  private executeCreation(effect: ParsedEffect, controller: Player, gameState: GameState): StateChange[] {
    return [{
      type: 'create',
      target: controller.id,
      data: { /* creation data */ }
    }];
  }

  /**
   * Execute destruction effects
   */
  private executeDestruction(effect: ParsedEffect, targets: any[]): StateChange[] {
    const changes: StateChange[] = [];
    
    targets.forEach(target => {
      changes.push({
        type: 'destroy',
        target: target.id
      });
    });
    
    return changes;
  }

  /**
   * Execute modification effects (stat changes, etc.)
   */
  private executeModification(effect: ParsedEffect, targets: any[]): StateChange[] {
    const changes: StateChange[] = [];
    
    targets.forEach(target => {
      changes.push({
        type: 'modify',
        target: target.id,
        data: { /* modification data */ }
      });
    });
    
    return changes;
  }

  /**
   * Get all continuous effects currently active
   */
  getContinuousEffects(): ParsedEffect[] {
    return [...this.continuousEffects];
  }

  /**
   * Remove expired continuous effects
   */
  cleanupExpiredEffects(gameState: GameState): void {
    this.continuousEffects = this.continuousEffects.filter(effect => {
      // Logic to determine if effect has expired
      return effect.duration === 'permanent';
    });
  }

  /**
   * Get effect execution history for debugging/replay
   */
  getExecutionHistory(): EffectExecution[] {
    return [...this.executionHistory];
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }
}

export default EffectParser;
