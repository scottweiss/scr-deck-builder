/**
 * Movement Engine for Sorcery TCG
 * Handles unit movement, range calculations, and movement restrictions
 */

import { Card } from '../../../types/card-types';
import { Player, GameState, BoardPosition } from '../../../types/game-types';
import { BoardStateManager } from './boardState';
import { PositionSystem } from './positionSystem';

export interface MovementRule {
  id: string;
  type: 'speed' | 'restriction' | 'enhancement' | 'special';
  value: number | string;
  condition?: string;
  duration?: 'turn' | 'permanent' | 'combat';
}

export interface MovementPath {
  start: BoardPosition;
  end: BoardPosition;
  path: BoardPosition[];
  cost: number;
  isValid: boolean;
  restrictions: string[];
}

export interface MovementRestriction {
  type: 'blocked' | 'difficult_terrain' | 'no_retreat' | 'forced_movement';
  source: string;
  affectedPositions: BoardPosition[];
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
  getMovementRange(cardId: string, gameState: GameState): BoardPosition[] {
    const card = this.findCardById(cardId, gameState);
    if (!card) return [];

    const currentPosition = this.boardState.getCardPosition(cardId);
    if (!currentPosition) return [];

    const speed = this.getCardSpeed(card, gameState);
    const validPositions: BoardPosition[] = [];

    // Calculate all positions within movement range
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const targetPosition: BoardPosition = { row, col };
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
    start: BoardPosition, 
    end: BoardPosition, 
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
  executeMovement(cardId: string, targetPosition: BoardPosition, gameState: GameState): boolean {
    const currentPosition = this.boardState.getCardPosition(cardId);
    if (!currentPosition) return false;

    const path = this.calculateMovementPath(currentPosition, targetPosition, cardId, gameState);
    if (!path.isValid) return false;

    const card = this.findCardById(cardId, gameState);
    if (!card) return false;

    const speed = this.getCardSpeed(card, gameState);
    if (path.cost > speed) return false;

    // Execute the movement
    this.boardState.moveCard(cardId, targetPosition);
    
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
    let baseSpeed = card.stats?.speed || 1;
    
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
    from: BoardPosition,
    to: BoardPosition,
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
    from: BoardPosition,
    to: BoardPosition,
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
  canMoveBetween(from: BoardPosition, to: BoardPosition, cardId: string, gameState: GameState): boolean {
    const path = this.calculateMovementPath(from, to, cardId, gameState);
    const card = this.findCardById(cardId, gameState);
    if (!card) return false;

    const speed = this.getCardSpeed(card, gameState);
    return path.isValid && path.cost <= speed;
  }

  /**
   * Get all movement restrictions affecting a position
   */
  getMovementRestrictionsAt(position: BoardPosition): MovementRestriction[] {
    return this.restrictions.filter(restriction =>
      restriction.affectedPositions.some(pos =>
        pos.row === position.row && pos.col === position.col
      )
    );
  }

  /**
   * Calculate distance between two positions
   */
  getDistance(from: BoardPosition, to: BoardPosition): number {
    return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
  }

  /**
   * Get all adjacent positions to a given position
   */
  getAdjacentPositions(position: BoardPosition): BoardPosition[] {
    const adjacent: BoardPosition[] = [];
    const directions = [
      { row: -1, col: 0 }, // North
      { row: 1, col: 0 },  // South
      { row: 0, col: -1 }, // West
      { row: 0, col: 1 },  // East
      { row: -1, col: -1 }, // Northwest
      { row: -1, col: 1 },  // Northeast
      { row: 1, col: -1 },  // Southwest
      { row: 1, col: 1 }    // Southeast
    ];

    for (const dir of directions) {
      const newPos = {
        row: position.row + dir.row,
        col: position.col + dir.col
      };
      
      // Check if position is within board bounds (assuming 8x8 for now)
      if (newPos.row >= 0 && newPos.row < 8 && newPos.col >= 0 && newPos.col < 8) {
        adjacent.push(newPos);
      }
    }

    return adjacent;
  }

  /**
   * Check if two positions are adjacent
   */
  areAdjacent(pos1: BoardPosition, pos2: BoardPosition): boolean {
    const distance = this.getDistance(pos1, pos2);
    return distance === 1 || (Math.abs(pos1.row - pos2.row) === 1 && Math.abs(pos1.col - pos2.col) === 1);
  }

  /**
   * Helper method to find card by ID
   */
  private findCardById(cardId: string, gameState: GameState): Card | null {
    // Search in both players' areas
    for (const player of [gameState.player1, gameState.player2]) {
      // Check creatures on board
      for (const creature of player.creatures) {
        if (creature.id === cardId) return creature;
      }
      
      // Check artifacts
      for (const artifact of player.artifacts) {
        if (artifact.id === cardId) return artifact;
      }
      
      // Check sites
      for (const site of player.sites) {
        if (site.id === cardId) return site;
      }
    }
    
    return null;
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
    const position = this.boardState.getCardPosition(cardId);
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
    start: BoardPosition,
    end: BoardPosition,
    maxDistance: number,
    gameState: GameState
  ): { positions: BoardPosition[]; cost: number; valid: boolean; restrictions: string[] } {
    // Simple pathfinding - for complex pathfinding, implement A* algorithm
    const dx = end.col - start.col;
    const dy = end.row - start.row;
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
    const path: BoardPosition[] = [start];
    let current = { ...start };
    
    while (current.col !== end.col || current.row !== end.row) {
      if (current.col < end.col) current.col++;
      else if (current.col > end.col) current.col--;
      else if (current.row < end.row) current.row++;
      else if (current.row > end.row) current.row--;
      
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
