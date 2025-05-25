/**
 * Targeting System for Sorcery TCG
 * Handles target validation, selection, and legal targeting rules
 */

import { Card, TargetType } from '../../../types/card-types';
import { GameState, Player, BoardPosition } from '../../../types/game-types';
import { BoardStateManager } from './boardState';

export interface TargetDescriptor {
  type: TargetType;
  count: number;
  optional: boolean;
  restrictions?: TargetRestriction[];
}

export interface TargetRestriction {
  type: 'controller' | 'opponent' | 'self' | 'other' | 'range' | 'type' | 'subtype' | 'cost';
  value?: any;
}

export interface TargetCandidate {
  id: string;
  type: 'player' | 'creature' | 'spell' | 'site' | 'position';
  object: any;
  position?: BoardPosition;
  controller?: Player;
  valid: boolean;
  restrictions?: string[];
}

export interface TargetingResult {
  valid: boolean;
  targets: TargetCandidate[];
  errors?: string[];
}

export class TargetingSystem {
  private boardState: BoardStateManager;
  
  constructor(boardState: BoardStateManager) {
    this.boardState = boardState;
  }

  /**
   * Get all valid targets for a given targeting requirement
   */
  async getValidTargets(
    targetTypes: TargetType[],
    gameState: GameState,
    controller: Player,
    sourceCard: Card,
    additionalRestrictions?: TargetRestriction[]
  ): Promise<TargetCandidate[]> {
    const candidates: TargetCandidate[] = [];

    for (const targetType of targetTypes) {
      switch (targetType) {
        case 'player':
          candidates.push(...this.getPlayerTargets(gameState, controller, sourceCard));
          break;
          
        case 'creature':
          candidates.push(...this.getCreatureTargets(gameState, controller, sourceCard));
          break;
          
        case 'spell':
          candidates.push(...this.getSpellTargets(gameState, controller, sourceCard));
          break;
          
        case 'site':
          candidates.push(...this.getSiteTargets(gameState, controller, sourceCard));
          break;
          
        case 'any':
          candidates.push(
            ...this.getPlayerTargets(gameState, controller, sourceCard),
            ...this.getCreatureTargets(gameState, controller, sourceCard),
            ...this.getSpellTargets(gameState, controller, sourceCard)
          );
          break;
          
        case 'position':
          candidates.push(...this.getPositionTargets(gameState, controller, sourceCard));
          break;
      }
    }

    // Apply additional restrictions
    if (additionalRestrictions) {
      return this.applyRestrictions(candidates, additionalRestrictions, controller);
    }

    return candidates.filter(c => c.valid);
  }

  /**
   * Validate a specific targeting choice
   */
  validateTargeting(
    targets: any[],
    targetDescriptor: TargetDescriptor,
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetingResult {
    const result: TargetingResult = {
      valid: true,
      targets: [],
      errors: []
    };

    // Check target count
    if (!targetDescriptor.optional && targets.length === 0) {
      result.valid = false;
      result.errors?.push('No targets selected when targets are required');
      return result;
    }

    if (targets.length > targetDescriptor.count) {
      result.valid = false;
      result.errors?.push(`Too many targets selected (max: ${targetDescriptor.count})`);
      return result;
    }

    // Validate each target
    for (const target of targets) {
      const candidate = this.createTargetCandidate(target, gameState);
      
      if (!this.isValidTarget(candidate, targetDescriptor, controller, sourceCard, gameState)) {
        result.valid = false;
        result.errors?.push(`Invalid target: ${candidate.id}`);
      }
      
      result.targets.push(candidate);
    }

    return result;
  }

  /**
   * Check if a target is within range of the source
   */
  isInRange(
    sourcePosition: BoardPosition,
    targetPosition: BoardPosition,
    range: number = Infinity
  ): boolean {
    if (range === Infinity) return true;
    
    const distance = this.boardState.getDistance(sourcePosition, targetPosition);
    return distance <= range;
  }

  /**
   * Check line of sight between two positions
   */
  hasLineOfSight(
    from: BoardPosition,
    to: BoardPosition,
    gameState: GameState
  ): boolean {
    return this.boardState.hasLineOfSight(from, to, gameState.board);
  }

  /**
   * Get valid player targets
   */
  private getPlayerTargets(
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetCandidate[] {
    const candidates: TargetCandidate[] = [];
    
    // Add all players as potential targets
    gameState.players.forEach(player => {
      candidates.push({
        id: player.id,
        type: 'player',
        object: player,
        controller: player,
        valid: true
      });
    });

    return candidates;
  }

  /**
   * Get valid creature targets
   */
  private getCreatureTargets(
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetCandidate[] {
    const candidates: TargetCandidate[] = [];
    
    // Get all creatures on the battlefield
    gameState.players.forEach(player => {
      player.battlefield.forEach(creature => {
        if (creature.type === 'Creature' || creature.type === 'Avatar') {
          const position = this.boardState.getCardPosition(creature.id, gameState.board);
          
          candidates.push({
            id: creature.id,
            type: 'creature',
            object: creature,
            position,
            controller: player,
            valid: true
          });
        }
      });
    });

    return candidates;
  }

  /**
   * Get valid spell targets (for counterspells, etc.)
   */
  private getSpellTargets(
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetCandidate[] {
    const candidates: TargetCandidate[] = [];
    
    // Check spells on the stack
    if (gameState.stack) {
      gameState.stack.forEach(stackItem => {
        if (stackItem.type === 'spell') {
          candidates.push({
            id: stackItem.id,
            type: 'spell',
            object: stackItem,
            controller: stackItem.controller,
            valid: true
          });
        }
      });
    }

    return candidates;
  }

  /**
   * Get valid site targets
   */
  private getSiteTargets(
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetCandidate[] {
    const candidates: TargetCandidate[] = [];
    
    // Get all sites on the battlefield
    gameState.players.forEach(player => {
      player.battlefield.forEach(site => {
        if (site.type === 'Site') {
          const position = this.boardState.getCardPosition(site.id, gameState.board);
          
          candidates.push({
            id: site.id,
            type: 'site',
            object: site,
            position,
            controller: player,
            valid: true
          });
        }
      });
    });

    return candidates;
  }

  /**
   * Get valid position targets (for movement, etc.)
   */
  private getPositionTargets(
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetCandidate[] {
    const candidates: TargetCandidate[] = [];
    
    // Get all valid board positions
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const position: BoardPosition = { row, col };
        const occupied = this.boardState.isPositionOccupied(position, gameState.board);
        
        candidates.push({
          id: `${row}-${col}`,
          type: 'position',
          object: position,
          position,
          valid: !occupied // Usually we want empty positions for movement
        });
      }
    }

    return candidates;
  }

  /**
   * Apply targeting restrictions to candidates
   */
  private applyRestrictions(
    candidates: TargetCandidate[],
    restrictions: TargetRestriction[],
    controller: Player
  ): TargetCandidate[] {
    return candidates.map(candidate => {
      const newCandidate = { ...candidate };
      newCandidate.restrictions = [];

      for (const restriction of restrictions) {
        switch (restriction.type) {
          case 'controller':
            if (candidate.controller?.id !== controller.id) {
              newCandidate.valid = false;
              newCandidate.restrictions.push('Must target your own permanent');
            }
            break;
            
          case 'opponent':
            if (candidate.controller?.id === controller.id) {
              newCandidate.valid = false;
              newCandidate.restrictions.push('Must target opponent\'s permanent');
            }
            break;
            
          case 'other':
            // Cannot target the source card itself
            if (candidate.object?.id === restriction.value) {
              newCandidate.valid = false;
              newCandidate.restrictions.push('Cannot target self');
            }
            break;
            
          case 'range':
            // Check range restriction
            if (restriction.value && candidate.position) {
              // Would need source position to check this properly
              // For now, assume valid
            }
            break;
            
          case 'type':
            if (candidate.object?.type !== restriction.value) {
              newCandidate.valid = false;
              newCandidate.restrictions.push(`Must be ${restriction.value}`);
            }
            break;
            
          case 'subtype':
            if (!candidate.object?.subtypes?.includes(restriction.value)) {
              newCandidate.valid = false;
              newCandidate.restrictions.push(`Must be ${restriction.value}`);
            }
            break;
            
          case 'cost':
            // Check converted mana cost restrictions
            if (candidate.object?.cost !== undefined && candidate.object.cost > restriction.value) {
              newCandidate.valid = false;
              newCandidate.restrictions.push(`Cost must be ${restriction.value} or less`);
            }
            break;
        }
      }

      return newCandidate;
    });
  }

  /**
   * Create a target candidate from a game object
   */
  private createTargetCandidate(target: any, gameState: GameState): TargetCandidate {
    // Determine target type
    let type: 'player' | 'creature' | 'spell' | 'site' | 'position' = 'creature';
    
    if (target.type === 'Player' || target.health !== undefined) {
      type = 'player';
    } else if (target.type === 'Site') {
      type = 'site';
    } else if (target.row !== undefined && target.col !== undefined) {
      type = 'position';
    }

    return {
      id: target.id || `${target.row}-${target.col}`,
      type,
      object: target,
      position: target.position || target,
      controller: target.controller,
      valid: true
    };
  }

  /**
   * Check if a specific target is valid
   */
  private isValidTarget(
    candidate: TargetCandidate,
    descriptor: TargetDescriptor,
    controller: Player,
    sourceCard: Card,
    gameState: GameState
  ): boolean {
    // Apply descriptor restrictions
    if (descriptor.restrictions) {
      const restrictedCandidates = this.applyRestrictions(
        [candidate],
        descriptor.restrictions,
        controller
      );
      return restrictedCandidates[0]?.valid || false;
    }

    return candidate.valid;
  }

  /**
   * Get all creatures that can be targeted by a spell
   */
  getTargetableCreatures(
    gameState: GameState,
    controller: Player,
    sourceCard: Card,
    includeUntargetable: boolean = false
  ): TargetCandidate[] {
    const creatures = this.getCreatureTargets(gameState, controller, sourceCard);
    
    if (includeUntargetable) {
      return creatures;
    }

    // Filter out creatures with protection or shroud
    return creatures.filter(creature => {
      const card = creature.object;
      
      // Check for shroud or hexproof
      if (card.keywords?.includes('shroud') || card.keywords?.includes('hexproof')) {
        return false;
      }
      
      // Check for protection
      if (card.keywords?.some((keyword: string) => keyword.startsWith('protection'))) {
        // More detailed protection checking would go here
        return false;
      }
      
      return true;
    });
  }

  /**
   * Check if a player can be targeted
   */
  canTargetPlayer(
    player: Player,
    controller: Player,
    sourceCard: Card,
    gameState: GameState
  ): boolean {
    // Check for effects that prevent targeting players
    // This would check for cards like "Leyline of Sanctity"
    
    return true; // Simplified for now
  }

  /**
   * Get the optimal targets for an AI player
   */
  getOptimalTargets(
    targetDescriptor: TargetDescriptor,
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetCandidate[] {
    const validTargets = this.getValidTargets(
      [targetDescriptor.type],
      gameState,
      controller,
      sourceCard,
      targetDescriptor.restrictions
    );

    // Simple AI targeting: prefer opponent's permanents for harmful effects
    // and own permanents for beneficial effects
    
    if (sourceCard.effect?.toLowerCase().includes('damage') || 
        sourceCard.effect?.toLowerCase().includes('destroy')) {
      // Prefer opponent's targets
      return validTargets.filter(t => t.controller?.id !== controller.id).slice(0, targetDescriptor.count);
    } else {
      // Prefer own targets for beneficial effects
      return validTargets.filter(t => t.controller?.id === controller.id).slice(0, targetDescriptor.count);
    }
  }
}

export default TargetingSystem;
