/**
 * Targeting System for Sorcery TCG
 * Handles target validation, selection, and legal targeting rules
 */

import { BoardPosition } from '../../../types/game-types';
import { Card, TargetType, CardType } from '../../../types/Card';
import { GameState, Position, GridSquare, Player } from './gameState';
import { BoardStateManager } from './boardState';
import { boardPositionToPosition, positionToBoardPosition, convertSimpleBoardToGridSquare } from '../../../utils/card-adapter';

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
  type: 'player' | 'minion' | 'spell' | 'site' | 'position';
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
        case 'minion':
          candidates.push(...this.getMinionTargets(gameState, controller, sourceCard));
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
            ...this.getMinionTargets(gameState, controller, sourceCard),
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
    
    const sourcePos = boardPositionToPosition(sourcePosition);
    const targetPos = boardPositionToPosition(targetPosition);
    const distance = this.boardState.getDistance(sourcePos, targetPos);
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
    const fromPos = boardPositionToPosition(from);
    const toPos = boardPositionToPosition(to);
    const gridBoard = gameState.grid;
    return this.boardState.hasLineOfSight(fromPos, toPos, gridBoard);
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
    // Use canonical player structure (object with player1/player2)
    const players = [gameState.players.player1, gameState.players.player2];
    for (const player of players) {
      candidates.push({
        id: player.id,
        type: 'player',
        object: player,
        controller: player,
        valid: true
      });
    }
    return candidates;
  }

  /**
   * Get valid minion targets (minions and avatars)
   */
  private getMinionTargets(
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetCandidate[] {
    const candidates: TargetCandidate[] = [];
    // Iterate over the board grid to find all minions and avatars
    const gridBoard: GridSquare[][] = gameState.grid;
    for (let y = 0; y < gridBoard.length; y++) {
      for (let x = 0; x < gridBoard[y].length; x++) {
        const square = gridBoard[y][x];
        for (const unit of square.units) {
          if (unit.card.type === CardType.Minion || unit.card.type === CardType.Avatar) {
            const owner = this.getPlayerById(gameState, unit.owner);
            const boardPos = positionToBoardPosition({ x, y });
            candidates.push({
              id: unit.card.id,
              type: 'minion',
              object: unit.card,
              position: boardPos,
              controller: owner,
              valid: true
            });
          }
        }
      }
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
    // Iterate over the board grid to find all sites
    const gridBoard: GridSquare[][] = gameState.grid;
    for (let y = 0; y < gridBoard.length; y++) {
      for (let x = 0; x < gridBoard[y].length; x++) {
        const square = gridBoard[y][x];
        if (square.site) {
          // Ownership of sites may be determined by control, here we set controller to undefined
          const boardPos = positionToBoardPosition({ x, y });
          candidates.push({
            id: square.site.id,
            type: 'site',
            object: square.site,
            position: boardPos,
            controller: undefined, // Could be set if ownership logic is available
            valid: true
          });
        }
      }
    }
    return candidates;
  }

  /**
   * Helper to get player by id from gameState
   */
  private getPlayerById(gameState: GameState, id: string): Player | undefined {
    if (gameState.players.player1.id === id) return gameState.players.player1;
    if (gameState.players.player2.id === id) return gameState.players.player2;
    return undefined;
  }

  /**
   * Get valid spell targets
   */
  private getSpellTargets(
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetCandidate[] {
    const candidates: TargetCandidate[] = [];
    // Use stack from gameState if available
    if (Array.isArray((gameState as any).stack)) {
      (gameState as any).stack.forEach((stackItem: { id: string; type: string; controller: Player }) => {
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
   * Get valid position targets
   */
  private getPositionTargets(
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): TargetCandidate[] {
    const candidates: TargetCandidate[] = [];
    // Use gameState.grid for board positions
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const position: BoardPosition = { row, col };
        const pos = boardPositionToPosition(position);
        const gridBoard = gameState.grid;
        const occupied = this.boardState.isPositionOccupied(pos, gridBoard);
        candidates.push({
          id: `${row}-${col}`,
          type: 'position',
          object: position,
          position,
          valid: !occupied
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
        }
      }

      return newCandidate;
    });
  }

  /**
   * Create a target candidate from a game object
   */
  private createTargetCandidate(target: any, gameState: GameState): TargetCandidate {
    let type: 'player' | 'minion' | 'spell' | 'site' | 'position' = 'minion';
    if (target.type === 'Player' || target.health !== undefined) {
      type = 'player';
    } else if (target.type === CardType.Site) {
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
    // For backward compatibility, alias to getMinionTargets
    const minions = this.getMinionTargets(gameState, controller, sourceCard);
    if (includeUntargetable) {
      return minions;
    }
    return minions.filter(minion => {
      const card = minion.object;
      if (card.keywords?.includes('shroud') || card.keywords?.includes('hexproof')) {
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
    return true;
  }

  /**
   * Get the optimal targets for an AI player
   */
  async getOptimalTargets(
    targetDescriptor: TargetDescriptor,
    gameState: GameState,
    controller: Player,
    sourceCard: Card
  ): Promise<TargetCandidate[]> {
    const validTargets = await this.getValidTargets(
      [targetDescriptor.type],
      gameState,
      controller,
      sourceCard,
      targetDescriptor.restrictions
    );

    if (sourceCard.effect?.toLowerCase().includes('damage') || 
        sourceCard.effect?.toLowerCase().includes('destroy')) {
      return validTargets.filter(t => t.controller?.id !== controller.id).slice(0, targetDescriptor.count);
    } else {
      return validTargets.filter(t => t.controller?.id === controller.id).slice(0, targetDescriptor.count);
    }
  }
}

export default TargetingSystem;
