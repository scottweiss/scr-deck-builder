/**
 * Position System for Sorcery TCG
 * Handles unit placement, positioning rules, and spatial mechanics
 */

import { Card } from '../../../types/card-types';
import { Player, GameState, BoardPosition } from '../../../types/game-types';
import { BoardStateManager } from './boardState';

export interface PositionRule {
  id: string;
  type: 'placement' | 'movement' | 'adjacency' | 'line_of_sight';
  condition: string;
  restriction: string;
  priority: number;
}

export interface PlacementRestriction {
  type: 'site_required' | 'adjacent_to' | 'not_adjacent_to' | 'region_specific' | 'range_limit';
  value?: string | number;
  sourceId?: string;
}

export interface PositionedCard {
  card: Card;
  position: BoardPosition;
  controller: string;
  placementTurn: number;
  modifiers: PositionModifier[];
}

export interface PositionModifier {
  type: 'range_bonus' | 'movement_bonus' | 'placement_restriction' | 'position_lock';
  value: number;
  sourceId: string;
  duration: 'turn' | 'permanent' | 'until_moved';
}

export interface PlacementValidation {
  valid: boolean;
  position: BoardPosition;
  card: Card;
  restrictions: PlacementRestriction[];
  errors: string[];
  warnings: string[];
}

export class PositionSystem {
  private boardState: BoardStateManager;
  private positionedCards: Map<string, PositionedCard> = new Map();
  private positionRules: PositionRule[] = [];
  private placementHistory: PlacementValidation[] = [];

  constructor(boardState: BoardStateManager) {
    this.boardState = boardState;
    this.initializePositionRules();
  }

  /**
   * Validate if a card can be placed at a specific position
   */
  validatePlacement(
    card: Card,
    position: BoardPosition,
    controller: Player,
    gameState: GameState
  ): PlacementValidation {
    const validation: PlacementValidation = {
      valid: true,
      position,
      card,
      restrictions: [],
      errors: [],
      warnings: []
    };

    // Check basic position validity
    if (!this.isValidBoardPosition(position)) {
      validation.valid = false;
      validation.errors.push('Position is outside the game board');
      return validation;
    }

    // Check if position is occupied
    if (this.boardState.isPositionOccupied(position, gameState.board)) {
      validation.valid = false;
      validation.errors.push('Position is already occupied');
      return validation;
    }

    // Apply card-specific placement rules
    this.applyCardPlacementRules(validation, controller, gameState);

    // Apply position-specific rules
    this.applyPositionRules(validation, gameState);

    // Apply regional restrictions
    this.applyRegionalRestrictions(validation, gameState);

    return validation;
  }

  /**
   * Place a card at a specific position
   */
  placeCard(
    card: Card,
    position: BoardPosition,
    controller: Player,
    gameState: GameState
  ): boolean {
    const validation = this.validatePlacement(card, position, controller, gameState);
    
    if (!validation.valid) {
      return false;
    }

    // Place the card on the board
    const placed = this.boardState.placeCard(card, position, gameState.board);
    
    if (placed) {
      // Track the positioned card
      const positionedCard: PositionedCard = {
        card,
        position,
        controller: controller.id,
        placementTurn: gameState.turnNumber,
        modifiers: []
      };
      
      this.positionedCards.set(card.id, positionedCard);
      
      // Record placement history
      this.placementHistory.push(validation);
      
      // Trigger placement effects
      this.triggerPlacementEffects(card, position, gameState);
    }

    return placed;
  }

  /**
   * Move a card from one position to another
   */
  moveCard(
    cardId: string,
    newPosition: BoardPosition,
    gameState: GameState
  ): boolean {
    const positionedCard = this.positionedCards.get(cardId);
    if (!positionedCard) {
      return false;
    }

    const oldPosition = positionedCard.position;
    
    // Validate the new position
    const controller = gameState.players.find(p => p.id === positionedCard.controller);
    if (!controller) {
      return false;
    }

    const validation = this.validatePlacement(positionedCard.card, newPosition, controller, gameState);
    if (!validation.valid) {
      return false;
    }

    // Remove from old position
    this.boardState.removeCard(oldPosition, gameState.board);
    
    // Place at new position
    const moved = this.boardState.placeCard(positionedCard.card, newPosition, gameState.board);
    
    if (moved) {
      // Update position tracking
      positionedCard.position = newPosition;
      
      // Trigger movement effects
      this.triggerMovementEffects(positionedCard.card, oldPosition, newPosition, gameState);
    } else {
      // Restore to old position if move failed
      this.boardState.placeCard(positionedCard.card, oldPosition, gameState.board);
    }

    return moved;
  }

  /**
   * Remove a card from the board
   */
  removeCard(cardId: string, gameState: GameState): boolean {
    const positionedCard = this.positionedCards.get(cardId);
    if (!positionedCard) {
      return false;
    }

    // Remove from board
    const removed = this.boardState.removeCard(positionedCard.position, gameState.board);
    
    if (removed) {
      // Remove from tracking
      this.positionedCards.delete(cardId);
      
      // Trigger removal effects
      this.triggerRemovalEffects(positionedCard.card, positionedCard.position, gameState);
    }

    return removed !== null;
  }

  /**
   * Get all cards adjacent to a position
   */
  getAdjacentCards(position: BoardPosition, gameState: GameState): PositionedCard[] {
    const adjacentPositions = this.boardState.getAdjacentPositions(position);
    const adjacentCards: PositionedCard[] = [];

    for (const adjPos of adjacentPositions) {
      const card = this.boardState.getCardAt(adjPos, gameState.board);
      if (card) {
        const positionedCard = this.positionedCards.get(card.id);
        if (positionedCard) {
          adjacentCards.push(positionedCard);
        }
      }
    }

    return adjacentCards;
  }

  /**
   * Get all cards within a specific range of a position
   */
  getCardsInRange(
    centerPosition: BoardPosition,
    range: number,
    gameState: GameState,
    includeCenter: boolean = false
  ): PositionedCard[] {
    const cardsInRange: PositionedCard[] = [];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const position: BoardPosition = { row, col };
        const distance = this.boardState.getDistance(centerPosition, position);

        if (distance <= range && (includeCenter || distance > 0)) {
          const card = this.boardState.getCardAt(position, gameState.board);
          if (card) {
            const positionedCard = this.positionedCards.get(card.id);
            if (positionedCard) {
              cardsInRange.push(positionedCard);
            }
          }
        }
      }
    }

    return cardsInRange;
  }

  /**
   * Check if two positions have line of sight
   */
  hasLineOfSight(
    position1: BoardPosition,
    position2: BoardPosition,
    gameState: GameState
  ): boolean {
    return this.boardState.hasLineOfSight(position1, position2, gameState.board);
  }

  /**
   * Get the position of a card by its ID
   */
  getCardPosition(cardId: string): BoardPosition | null {
    const positionedCard = this.positionedCards.get(cardId);
    return positionedCard ? positionedCard.position : null;
  }

  /**
   * Get all positioned cards for a player
   */
  getPlayerCards(playerId: string): PositionedCard[] {
    return Array.from(this.positionedCards.values())
      .filter(pc => pc.controller === playerId);
  }

  /**
   * Apply position modifier to a card
   */
  addPositionModifier(cardId: string, modifier: PositionModifier): void {
    const positionedCard = this.positionedCards.get(cardId);
    if (positionedCard) {
      positionedCard.modifiers.push(modifier);
    }
  }

  /**
   * Remove position modifier from a card
   */
  removePositionModifier(cardId: string, modifierId: string): void {
    const positionedCard = this.positionedCards.get(cardId);
    if (positionedCard) {
      positionedCard.modifiers = positionedCard.modifiers.filter(
        m => m.sourceId !== modifierId
      );
    }
  }

  /**
   * Get valid placement positions for a card
   */
  getValidPlacementPositions(
    card: Card,
    controller: Player,
    gameState: GameState
  ): BoardPosition[] {
    const validPositions: BoardPosition[] = [];

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const position: BoardPosition = { row, col };
        const validation = this.validatePlacement(card, position, controller, gameState);
        
        if (validation.valid) {
          validPositions.push(position);
        }
      }
    }

    return validPositions;
  }

  /**
   * Check if a card can be placed at a specific position
   */
  canPlaceCard(
    card: Card,
    position: BoardPosition,
    controller: string,
    gameState: GameState
  ): boolean {
    const player = gameState.players.find(p => p.id === controller);
    if (!player) return false;
    
    const validation = this.validatePlacement(card, position, player, gameState);
    return validation.valid;
  }

  // Private helper methods

  private initializePositionRules(): void {
    // Site placement rules
    this.positionRules.push({
      id: 'site-adjacent',
      type: 'placement',
      condition: 'card.type === "Site"',
      restriction: 'must be adjacent to existing site or starting position',
      priority: 1
    });

    // Creature placement rules
    this.positionRules.push({
      id: 'creature-site',
      type: 'placement',
      condition: 'card.type === "Creature"',
      restriction: 'must be placed on or adjacent to friendly site',
      priority: 2
    });

    // Avatar placement rules
    this.positionRules.push({
      id: 'avatar-placement',
      type: 'placement',
      condition: 'card.type === "Avatar"',
      restriction: 'must be placed on friendly site',
      priority: 3
    });
  }

  private isValidBoardPosition(position: BoardPosition): boolean {
    return position.row >= 0 && position.row < 4 && 
           position.col >= 0 && position.col < 5;
  }

  private applyCardPlacementRules(
    validation: PlacementValidation,
    controller: Player,
    gameState: GameState
  ): void {
    const card = validation.card;

    switch (card.type) {
      case 'Site':
        this.applySitePlacementRules(validation, controller, gameState);
        break;
        
      case 'Creature':
        this.applyCreaturePlacementRules(validation, controller, gameState);
        break;
        
      case 'Avatar':
        this.applyAvatarPlacementRules(validation, controller, gameState);
        break;
        
      default:
        // No special placement rules for other card types
        break;
    }
  }

  private applySitePlacementRules(
    validation: PlacementValidation,
    controller: Player,
    gameState: GameState
  ): void {
    // Sites must be placed adjacent to existing sites or at starting positions
    const playerSites = this.getPlayerCards(controller.id)
      .filter(pc => pc.card.type === 'Site');

    if (playerSites.length === 0) {
      // First site - check starting positions
      if (!this.isStartingPosition(validation.position, controller.id)) {
        validation.valid = false;
        validation.errors.push('First site must be placed at starting position');
      }
    } else {
      // Additional sites must be adjacent to existing sites
      const adjacentToSite = playerSites.some(site => 
        this.boardState.getDistance(validation.position, site.position) === 1
      );
      
      if (!adjacentToSite) {
        validation.valid = false;
        validation.errors.push('Site must be adjacent to existing friendly site');
      }
    }
  }

  private applyCreaturePlacementRules(
    validation: PlacementValidation,
    controller: Player,
    gameState: GameState
  ): void {
    // Creatures must be placed on or adjacent to friendly sites
    const playerSites = this.getPlayerCards(controller.id)
      .filter(pc => pc.card.type === 'Site');

    const validPlacement = playerSites.some(site => {
      const distance = this.boardState.getDistance(validation.position, site.position);
      return distance <= 1; // On the site or adjacent
    });

    if (!validPlacement) {
      validation.valid = false;
      validation.errors.push('Creature must be placed on or adjacent to friendly site');
    }
  }

  private applyAvatarPlacementRules(
    validation: PlacementValidation,
    controller: Player,
    gameState: GameState
  ): void {
    // Avatars must be placed on friendly sites
    const siteAtPosition = this.boardState.getCardAt(validation.position, gameState.board);
    
    if (!siteAtPosition || siteAtPosition.type !== 'Site') {
      validation.valid = false;
      validation.errors.push('Avatar must be placed on a site');
      return;
    }

    // Check if site is controlled by the player
    const siteController = this.positionedCards.get(siteAtPosition.id)?.controller;
    if (siteController !== controller.id) {
      validation.valid = false;
      validation.errors.push('Avatar must be placed on friendly site');
    }
  }

  private applyPositionRules(validation: PlacementValidation, gameState: GameState): void {
    // Apply general position-based rules
    // This could include regional effects, special position properties, etc.
  }

  private applyRegionalRestrictions(validation: PlacementValidation, gameState: GameState): void {
    // Apply restrictions based on board regions (void, surface, underground, underwater)
    // This would integrate with the region manager
  }

  private isStartingPosition(position: BoardPosition, playerId: string): boolean {
    // Define starting positions for each player
    // This is game-specific and would depend on the setup rules
    return position.row === 0 || position.row === 3; // Simplified: top and bottom rows
  }

  private triggerPlacementEffects(card: Card, position: BoardPosition, gameState: GameState): void {
    // Trigger "when placed" or "enters the battlefield" effects
    // This would integrate with the effect parser
  }

  private triggerMovementEffects(
    card: Card,
    oldPosition: BoardPosition,
    newPosition: BoardPosition,
    gameState: GameState
  ): void {
    // Trigger movement-related effects
    // This would integrate with the effect parser
  }

  private triggerRemovalEffects(card: Card, position: BoardPosition, gameState: GameState): void {
    // Trigger "when removed" or "leaves the battlefield" effects
    // This would integrate with the effect parser
  }
}

export default PositionSystem;
