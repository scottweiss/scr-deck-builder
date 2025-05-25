/**
 * Movement Engine for Sorcery TCG
 * Handles unit movement, range calculations, and movement restrictions
 */

import { Card } from '../../../types/card-types';
import { GameState, Position } from './gameState';
import { BoardStateManager } from './boardState';
import { PositionSystem } from './positionSystem';
import { positionToBoardPosition } from '../../../utils/card-adapter';

export interface MovementRule {
  id: string;
  type: 'speed' | 'restriction' | 'enhancement' | 'special';
  value: number | string;
  condition?: string;
  duration?: 'turn' | 'permanent' | 'combat';
}

export interface MovementPath {
  start: Position;
  end: Position;
  path: Position[];
  cost: number;
  isValid: boolean;
  restrictions: string[];
}

export interface MovementRestriction {
  type: 'blocked' | 'difficult_terrain' | 'no_retreat' | 'forced_movement';
  source: string;
  affectedPositions: Position[];
  modifier?: number;
}

export class MovementEngine {
  private boardState: BoardStateManager;
  private positionSystem: PositionSystem;
  private movementRules: Map<string, MovementRule[]> = new Map();
  private restrictions: MovementRestriction[] = [];

  constructor(boardState: BoardStateManager, positionSystem: PositionSystem) {
    this.boardState = boardState;
    this.positionSystem = positionSystem;
  }

  /**
   * Calculate movement range for a card
   */
  getMovementRange(cardId: string, gameState: GameState): Position[] {
    const card = this.findCardById(cardId, gameState);
    if (!card) return [];

    const currentPosition = this.getCardPosition(cardId, gameState);
    if (!currentPosition) return [];

    const speed = this.getCardSpeed(card, gameState);
    const validPositions: Position[] = [];

    // Calculate all positions within movement range
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const targetPosition: Position = { x: col, y: row };
        const path = this.calculateMovementPath(currentPosition, targetPosition, cardId, gameState);
        
        if (path.isValid && path.cost <= speed) {
          validPositions.push(targetPosition);
        }
      }
    }

    return validPositions;
  }

  /**
   * Calculate the optimal path between two positions
   */
  calculateMovementPath(
    start: Position, 
    end: Position, 
    cardId: string, 
    gameState: GameState
  ): MovementPath {
    const card = this.findCardById(cardId, gameState);
    if (!card) {
      return {
        start,
        end,
        path: [],
        cost: Infinity,
        isValid: false,
        restrictions: ['card_not_found']
      };
    }

    const speed = this.getMovementSpeed(card);
    const path = this.calculateOptimalPath(start, end, speed, gameState);
    
    return {
      start,
      end,
      path: path.positions,
      cost: path.cost,
      isValid: path.valid,
      restrictions: path.restrictions
    };
  }

  /**
   * Execute a movement action
   */
  executeMovement(cardId: string, targetPosition: Position, gameState: GameState): boolean {
    const currentPosition = this.getCardPosition(cardId, gameState);
    if (!currentPosition) return false;

    const path = this.calculateMovementPath(currentPosition, targetPosition, cardId, gameState);
    if (!path.isValid) return false;

    const card = this.findCardById(cardId, gameState);
    if (!card) return false;

    const speed = this.getCardSpeed(card, gameState);
    if (path.cost > speed) return false;

    // Execute the movement
    if (!this.moveCard(cardId, targetPosition, gameState)) return false;
    
    // Apply movement effects
    this.applyMovementEffects(cardId, currentPosition, targetPosition, gameState);
    
    // Trigger movement-related events
    this.triggerMovementEvents(cardId, path, gameState);

    return true;
  }

  /**
   * Get card movement speed
   */
  private getCardSpeed(card: Card, gameState: GameState): number {
    let baseSpeed = 1; // Default speed for all cards
    
    // Apply movement modifiers
    const rules = this.movementRules.get(card.id) || [];
    for (const rule of rules) {
      if (rule.type === 'speed' && typeof rule.value === 'number') {
        baseSpeed += rule.value;
      }
    }

    // Apply global movement effects
    // TODO: Check for global effects that modify movement

    return Math.max(0, baseSpeed);
  }

  /**
   * Check if destination is valid for movement
   */
  isValidDestination(
    from: Position,
    to: Position,
    cardId: string,
    gameState: GameState
  ): boolean {
    const path = this.calculateMovementPath(from, to, cardId, gameState);
    return path.isValid;
  }

  /**
   * Get movement cost between two positions
   */
  getMovementCost(
    from: Position,
    to: Position,
    cardId: string,
    gameState: GameState
  ): number {
    const path = this.calculateMovementPath(from, to, cardId, gameState);
    return path.cost;
  }

  /**
   * Add a movement rule for a specific card
   */
  addMovementRule(cardId: string, rule: MovementRule): void {
    if (!this.movementRules.has(cardId)) {
      this.movementRules.set(cardId, []);
    }
    const rules = this.movementRules.get(cardId)!;
    rules.push(rule);
  }

  /**
   * Remove a movement rule for a specific card
   */
  removeMovementRule(cardId: string, ruleId: string): boolean {
    const rules = this.movementRules.get(cardId);
    if (!rules) return false;

    const index = rules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Add movement restriction to the board
   */
  addMovementRestriction(restriction: MovementRestriction): void {
    this.restrictions.push(restriction);
  }

  /**
   * Remove movement restriction
   */
  removeMovementRestriction(source: string): void {
    this.restrictions = this.restrictions.filter(r => r.source !== source);
  }

  /**
   * Check if movement is possible between two positions
   */
  canMoveBetween(from: Position, to: Position, cardId: string, gameState: GameState): boolean {
    const path = this.calculateMovementPath(from, to, cardId, gameState);
    const card = this.findCardById(cardId, gameState);
    if (!card) return false;

    const speed = this.getCardSpeed(card, gameState);
    return path.isValid && path.cost <= speed;
  }

  /**
   * Get all movement restrictions affecting a position
   */
  getMovementRestrictionsAt(position: Position): MovementRestriction[] {
    return this.restrictions.filter(restriction =>
      restriction.affectedPositions.some(pos => {
        const a = positionToBoardPosition(pos);
        const b = positionToBoardPosition(position);
        return a.row === b.row && a.col === b.col;
      })
    );
  }

  /**
   * Calculate distance between two positions
   */
  getDistance(from: Position, to: Position): number {
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
  }

  /**
   * Get all adjacent positions to a given position
   */
  getAdjacentPositions(position: Position): Position[] {
    const adjacent: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // North
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }, // West
      { x: 1, y: 0 },  // East
      { x: -1, y: -1 }, // Northwest
      { x: 1, y: -1 },  // Northeast
      { x: -1, y: 1 },  // Southwest
      { x: 1, y: 1 }    // Southeast
    ];

    for (const dir of directions) {
      const newPos = {
        x: position.x + dir.x,
        y: position.y + dir.y
      };
      // Check if position is within board bounds (4x5)
      if (newPos.x >= 0 && newPos.x < 5 && newPos.y >= 0 && newPos.y < 4) {
        adjacent.push(newPos);
      }
    }

    return adjacent;
  }

  /**
   * Check if two positions are adjacent
   */
  areAdjacent(pos1: Position, pos2: Position): boolean {
    const distance = this.getDistance(pos1, pos2);
    return distance === 1 || (Math.abs(pos1.x - pos2.x) === 1 && Math.abs(pos1.y - pos2.y) === 1);
  }

  /**
   * Reset movement engine state
   */
  reset(): void {
    this.movementRules.clear();
    this.restrictions = [];
  }

  /**
   * Get movement summary for debugging
   */
  getMovementSummary(cardId: string, gameState: GameState): object {
    const card = this.findCardById(cardId, gameState);
    const position = this.getCardPosition(cardId, gameState);
    const speed = card ? this.getCardSpeed(card, gameState) : 0;
    const range = this.getMovementRange(cardId, gameState);
    
    return {
      cardId,
      cardName: card?.name || 'Unknown',
      currentPosition: position,
      speed,
      validMoves: range.length,
      movementRules: this.movementRules.get(cardId) || [],
      activeRestrictions: this.restrictions.length
    };
  }

  /**
   * Get card position from game state
   */
  private getCardPosition(cardId: string, gameState: GameState): Position | null {
    if (gameState.grid) {
      for (let row = 0; row < gameState.grid.length; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
          const square = gameState.grid[row][col];
          if (square.site && square.site.id === cardId) {
            return { x: col, y: row };
          }
          for (const unit of square.units) {
            if (unit.card.id === cardId) {
              return { x: col, y: row };
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Find a card by ID in the game state
   */
  private findCardById(cardId: string, gameState: GameState): Card | null {
    // Search through all players' battlefield and hand
    for (const player of Object.values(gameState.players)) {
      // battlefield and hand are not arrays of Card in new model, so skip
      // Instead, search grid for site/units
    }
    // Check board positions
    if (gameState.grid) {
      for (const row of gameState.grid) {
        for (const square of row) {
          if (square.site && square.site.id === cardId) {
            return square.site;
          }
          for (const unit of square.units) {
            if (unit.card.id === cardId) {
              return unit.card;
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Move a card to a new position (placeholder implementation)
   */
  private moveCard(cardId: string, targetPosition: Position, gameState: GameState): boolean {
    // This would integrate with the actual board state management
    // For now, return true as a placeholder
    return true;
  }

  /**
   * Apply movement effects (placeholder implementation)
   */
  private applyMovementEffects(cardId: string, from: Position, to: Position, gameState: GameState): void {
    // Apply any effects that trigger on movement
    // Placeholder implementation
  }

  /**
   * Trigger movement-related events (placeholder implementation)
   */
  private triggerMovementEvents(cardId: string, path: MovementPath, gameState: GameState): void {
    // Trigger any events related to movement
    // Placeholder implementation
  }

  // Private helper methods

  private getMovementSpeed(card: Card): number {
    let baseSpeed = 1; // Default movement speed
    
    // Apply speed modifiers from card rules
    const speedRules = this.movementRules.get(card.id) || [];
    for (const rule of speedRules) {
      if (rule.type === 'speed') {
        baseSpeed += typeof rule.value === 'number' ? rule.value : 0;
      }
    }
    
    return Math.max(1, baseSpeed);
  }

  private calculateOptimalPath(
    start: Position,
    end: Position,
    maxDistance: number,
    gameState: GameState
  ): { positions: Position[]; cost: number; valid: boolean; restrictions: string[] } {
    // Simple pathfinding - for complex pathfinding, implement A* algorithm
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.abs(dx) + Math.abs(dy);
    
    if (distance > maxDistance) {
      return {
        positions: [],
        cost: Infinity,
        valid: false,
        restrictions: ['distance_exceeded']
      };
    }

    // Generate simple straight-line path
    const path: Position[] = [start];
    let current = { ...start };
    
    while (current.x !== end.x || current.y !== end.y) {
      if (current.x < end.x) current.x++;
      else if (current.x > end.x) current.x--;
      else if (current.y < end.y) current.y++;
      else if (current.y > end.y) current.y--;
      
      path.push({ ...current });
    }
    
    return {
      positions: path,
      cost: distance,
      valid: true,
      restrictions: []
    };
  }
}
