/**
 * Region Manager for Sorcery TCG
 * Handles regional effects and terrain-based modifiers (void/surface/underground/underwater)
 */

import { Card } from '../../../types/Card';
import { GameState, Position } from './gameState';
import { BoardStateManager } from './boardState';
import { BoardPosition } from '../../../types/game-types';

export type RegionType = 'void' | 'surface' | 'underground' | 'underwater';

export interface RegionEffect {
  id: string;
  type: RegionType;
  name: string;
  description: string;
  effect: (card: Card, position: BoardPosition) => void;
  duration: 'permanent' | 'turn' | 'phase';
  stackable: boolean;
}

export interface RegionModifier {
  type: 'stat_bonus' | 'ability_grant' | 'cost_reduction' | 'movement_bonus';
  value: number | string;
  duration: 'permanent' | 'turn' | 'phase';
  sourceRegion: RegionType;
  conditions?: string[];
}

export interface RegionInteraction {
  regionA: RegionType;
  regionB: RegionType;
  type: 'conflict' | 'synergy' | 'neutral';
  effect?: string;
  priority: number;
}

export interface RegionalZone {
  id: string;
  type: RegionType;
  positions: BoardPosition[];
  activeEffects: RegionEffect[];
  modifiers: RegionModifier[];
  controller?: string;
}

export class RegionManager {
  private boardState: BoardStateManager;
  private activeRegions: Map<string, RegionalZone> = new Map();
  private positionRegionMap: Map<string, RegionType> = new Map();
  private regionEffects: Map<RegionType, RegionEffect[]> = new Map();
  private regionInteractions: RegionInteraction[] = [];

  constructor(boardState: BoardStateManager) {
    this.boardState = boardState;
    this.initializeRegionTypes();
    this.initializeRegionInteractions();
  }

  /**
   * Create a new regional zone
   */
  createRegion(
    id: string,
    type: RegionType,
    positions: BoardPosition[],
    controller?: string
  ): boolean {
    if (this.activeRegions.has(id)) {
      return false; // Region already exists
    }

    const region: RegionalZone = {
      id,
      type,
      positions,
      activeEffects: this.getRegionEffects(type),
      modifiers: [],
      controller
    };

    this.activeRegions.set(id, region);
    
    // Map positions to region type
    positions.forEach(pos => {
      const posKey = this.getPositionKey(pos);
      this.positionRegionMap.set(posKey, type);
    });

    return true;
  }

  /**
   * Remove a regional zone
   */
  removeRegion(regionId: string): boolean {
    const region = this.activeRegions.get(regionId);
    if (!region) {
      return false;
    }

    // Clear position mappings
    region.positions.forEach(pos => {
      const posKey = this.getPositionKey(pos);
      this.positionRegionMap.delete(posKey);
    });

    this.activeRegions.delete(regionId);
    return true;
  }

  /**
   * Get the region type at a specific position
   */
  getRegionAt(position: BoardPosition): RegionType {
    const posKey = this.getPositionKey(position);
    return this.positionRegionMap.get(posKey) || 'surface'; // Default to surface
  }

  /**
   * Apply regional modifiers to a card
   */
  applyRegionalModifiers(
    card: Card,
    position: BoardPosition,
    gameState: GameState
  ): RegionModifier[] {
    const regionType = this.getRegionAt(position);
    const appliedModifiers: RegionModifier[] = [];

    // Get all regions that affect this position
    for (const [regionId, region] of this.activeRegions) {
      if (this.regionContainsPosition(region, position)) {
        region.modifiers.forEach(modifier => {
          if (this.shouldApplyModifier(modifier, card, regionType)) {
            appliedModifiers.push(modifier);
            this.applyModifierToCard(card, modifier);
          }
        });
      }
    }

    return appliedModifiers;
  }

  /**
   * Check for region conflicts at a position
   */
  checkRegionConflicts(position: BoardPosition): RegionInteraction[] {
    const conflicts: RegionInteraction[] = [];
    const regionType = this.getRegionAt(position);

    // Check interactions with adjacent regions
    const adjacentPositions = this.getAdjacentPositions(position);
    
    adjacentPositions.forEach(adjPos => {
      const adjRegionType = this.getRegionAt(adjPos);
      if (adjRegionType !== regionType) {
        const interaction = this.findRegionInteraction(regionType, adjRegionType);
        if (interaction && interaction.type === 'conflict') {
          conflicts.push(interaction);
        }
      }
    });

    return conflicts;
  }

  /**
   * Get all active effects at a position
   */
  getActiveEffects(position: BoardPosition): RegionEffect[] {
    const effects: RegionEffect[] = [];
    
    for (const [regionId, region] of this.activeRegions) {
      if (this.regionContainsPosition(region, position)) {
        effects.push(...region.activeEffects);
      }
    }

    return effects;
  }

  /**
   * Update region based on game state changes
   */
  updateRegions(gameState: GameState): void {
    // Process region effects that depend on game state
    for (const [regionId, region] of this.activeRegions) {
      this.processRegionEffects(region, gameState);
      this.updateRegionModifiers(region, gameState);
    }

    // Check for new region interactions
    this.processRegionInteractions(gameState);
  }

  /**
   * Get regional placement restrictions
   */
  getPlacementRestrictions(
    position: BoardPosition,
    card: Card
  ): string[] {
    const restrictions: string[] = [];
    const regionType = this.getRegionAt(position);
    
    // Check card-specific region restrictions based on keywords
    if (regionType === 'underwater' && !card.keywords?.includes('Aquatic')) {
      restrictions.push('Card cannot be placed in underwater region without Aquatic keyword');
    }
    
    if (regionType === 'underground' && !card.keywords?.includes('Tunneling')) {
      restrictions.push('Card cannot be placed in underground region without Tunneling keyword');
    }

    if (regionType === 'void' && !card.keywords?.includes('Void Affinity')) {
      restrictions.push('Card cannot be placed in void region without Void Affinity keyword');
    }

    // Check for region conflicts
    const conflicts = this.checkRegionConflicts(position);
    conflicts.forEach(conflict => {
      restrictions.push(`Region conflict: ${conflict.effect || 'Unknown conflict'}`);
    });

    return restrictions;
  }

  /**
   * Check if a card can be placed in a specific region
   */
  canPlaceInRegion(
    card: Card,
    position: BoardPosition,
    regionType: RegionType
  ): boolean {
    // Check card-specific region restrictions based on keywords
    if (regionType === 'underwater' && !card.keywords?.includes('Aquatic')) {
      return false;
    }
    
    if (regionType === 'underground' && !card.keywords?.includes('Tunneling')) {
      return false;
    }

    if (regionType === 'void' && !card.keywords?.includes('Void Affinity')) {
      return false;
    }

    // Check for region conflicts that would prevent placement
    const conflicts = this.checkRegionConflicts(position);
    return conflicts.length === 0;
  }

  /**
   * Get region effects at a specific position
   */
  getRegionEffectsAt(position: BoardPosition): RegionEffect[] {
    return this.getActiveEffects(position);
  }

  /**
   * Resolve region conflicts at a position
   */
  resolveRegionConflicts(
    position: BoardPosition,
    gameState: GameState
  ): RegionInteraction[] {
    const conflicts = this.checkRegionConflicts(position);
    const resolved: RegionInteraction[] = [];

    // Sort conflicts by priority and resolve them
    const sortedConflicts = conflicts.sort((a, b) => a.priority - b.priority);
    
    for (const conflict of sortedConflicts) {
      // Apply conflict resolution logic
      this.applyConflictEffect(conflict, gameState);
      resolved.push(conflict);
    }

    return resolved;
  }

  /**
   * Get regional movement restrictions for a position
   */
  getRegionalMovementRestrictions(
    position: BoardPosition,
    card: Card
  ): string[] {
    const restrictions: string[] = [];
    const regionType = this.getRegionAt(position);
    
    // Check region-specific movement restrictions
    switch (regionType) {
      case 'void':
        restrictions.push('Void energy interferes with normal movement');
        break;
      case 'underwater':
        if (!card.keywords?.includes('Aquatic')) {
          restrictions.push('Unit cannot move underwater without special ability');
        }
        break;
      case 'underground':
        if (!card.keywords?.includes('Tunneling')) {
          restrictions.push('Unit cannot move underground without tunneling ability');
        }
        break;
      case 'surface':
        // Surface has no special restrictions
        break;
    }

    // Check for movement conflicts with adjacent regions
    const conflicts = this.checkRegionConflicts(position);
    conflicts.forEach(conflict => {
      if (conflict.type === 'conflict') {
        restrictions.push(`Movement restricted due to region conflict: ${conflict.effect}`);
      }
    });

    return restrictions;
  }

  /**
   * Process region effects that occur at turn boundaries
   */
  processRegionTurnEffects(gameState: GameState): void {
    for (const [regionId, region] of this.activeRegions) {
      // Process turn-based region effects
      region.activeEffects.forEach(effect => {
        if (effect.duration === 'turn') {
          // Apply turn-end effects
          region.positions.forEach(pos => {
            const gridSquare = gameState.grid[pos.row]?.[pos.col];
            if (gridSquare) {
              if (gridSquare.site) {
                effect.effect(gridSquare.site, pos);
              }
              for (const unit of gridSquare.units) {
                effect.effect(unit.card, pos);
              }
            }
          });
        }
      });

      // Update region modifiers for new turn
      region.modifiers.forEach(modifier => {
        if (modifier.duration === 'turn') {
          // Reset or refresh turn-based modifiers
          this.refreshTurnModifier(modifier, region, gameState);
        }
      });

      // Check for region state changes based on turn progression
      this.updateRegionTurnState(region, gameState);
    }
  }

  /**
   * Reset region manager (for cleanup)
   */
  reset(): void {
    this.activeRegions.clear();
    this.positionRegionMap.clear();
    this.regionEffects.clear();
    this.regionInteractions = [];
    this.initializeRegionTypes();
    this.initializeRegionInteractions();
  }

  // Private helper methods

  private initializeRegionTypes(): void {
    // Initialize default effects for each region type
    const voidEffects: RegionEffect[] = [
      {
        id: 'void-energy',
        type: 'void',
        name: 'Void Energy',
        description: 'Units in void regions gain +1 energy per turn',
        effect: (card: Card) => {
          // Implementation would add energy bonus
        },
        duration: 'permanent',
        stackable: false
      }
    ];

    const surfaceEffects: RegionEffect[] = [
      {
        id: 'surface-mobility',
        type: 'surface',
        name: 'Surface Mobility',
        description: 'Units move freely on surface terrain',
        effect: (card: Card) => {
          // Implementation would add movement bonus
        },
        duration: 'permanent',
        stackable: false
      }
    ];

    const undergroundEffects: RegionEffect[] = [
      {
        id: 'underground-protection',
        type: 'underground',
        name: 'Underground Protection',
        description: 'Units underground gain +1 defense',
        effect: (card: Card) => {
          // Implementation would add defense bonus
        },
        duration: 'permanent',
        stackable: false
      }
    ];

    const underwaterEffects: RegionEffect[] = [
      {
        id: 'underwater-concealment',
        type: 'underwater',
        name: 'Underwater Concealment',
        description: 'Units underwater are harder to target',
        effect: (card: Card) => {
          // Implementation would add concealment
        },
        duration: 'permanent',
        stackable: false
      }
    ];

    this.regionEffects.set('void', voidEffects);
    this.regionEffects.set('surface', surfaceEffects);
    this.regionEffects.set('underground', undergroundEffects);
    this.regionEffects.set('underwater', underwaterEffects);
  }

  private initializeRegionInteractions(): void {
    this.regionInteractions = [
      {
        regionA: 'void',
        regionB: 'surface',
        type: 'conflict',
        effect: 'Void energy interferes with surface magic',
        priority: 1
      },
      {
        regionA: 'underground',
        regionB: 'underwater',
        type: 'synergy',
        effect: 'Underground and underwater provide combined concealment',
        priority: 2
      },
      {
        regionA: 'surface',
        regionB: 'underground',
        type: 'neutral',
        priority: 3
      },
      {
        regionA: 'void',
        regionB: 'underwater',
        type: 'conflict',
        effect: 'Void energy destabilizes underwater currents',
        priority: 1
      }
    ];
  }

  private getRegionEffects(type: RegionType): RegionEffect[] {
    return this.regionEffects.get(type) || [];
  }

  private getPositionKey(position: BoardPosition): string {
    return `${position.row},${position.col}`;
  }

  private regionContainsPosition(region: RegionalZone, position: BoardPosition): boolean {
    return region.positions.some(pos => 
      pos.row === position.row && pos.col === position.col
    );
  }

  private shouldApplyModifier(
    modifier: RegionModifier,
    card: Card,
    regionType: RegionType
  ): boolean {
    if (modifier.sourceRegion !== regionType) {
      return false;
    }

    if (modifier.conditions) {
      // Check modifier conditions against card
      return modifier.conditions.every(condition => {
        // Simple condition checking - would be more sophisticated in real implementation
        return this.evaluateCondition(condition, card);
      });
    }

    return true;
  }

  private applyModifierToCard(card: Card, modifier: RegionModifier): void {
    // Implementation would modify card properties based on modifier
    // This is a placeholder for the actual modifier application logic
  }

  private getAdjacentPositions(position: BoardPosition): BoardPosition[] {
    const adjacent: BoardPosition[] = [];
    const directions = [
      { row: -1, col: 0 }, { row: 1, col: 0 },   // Up, Down
      { row: 0, col: -1 }, { row: 0, col: 1 },   // Left, Right
      { row: -1, col: -1 }, { row: 1, col: -1 }, // Diagonals
      { row: -1, col: 1 }, { row: 1, col: 1 }
    ];

    directions.forEach(dir => {
      adjacent.push({
        row: position.row + dir.row,
        col: position.col + dir.col
      });
    });

    return adjacent;
  }

  private findRegionInteraction(
    regionA: RegionType,
    regionB: RegionType
  ): RegionInteraction | undefined {
    return this.regionInteractions.find(interaction => 
      (interaction.regionA === regionA && interaction.regionB === regionB) ||
      (interaction.regionA === regionB && interaction.regionB === regionA)
    );
  }

  private processRegionEffects(region: RegionalZone, gameState: GameState): void {
    // Process time-based effects and updates
    region.activeEffects = region.activeEffects.filter(effect => {
      if (effect.duration === 'turn' && this.shouldExpireEffect(effect, gameState)) {
        return false;
      }
      return true;
    });
  }

  private updateRegionModifiers(region: RegionalZone, gameState: GameState): void {
    // Update region modifiers based on game state
    region.modifiers = region.modifiers.filter(modifier => {
      if (modifier.duration === 'turn' && this.shouldExpireModifier(modifier, gameState)) {
        return false;
      }
      return true;
    });
  }

  private processRegionInteractions(gameState: GameState): void {
    // Process interactions between different regions
    for (const interaction of this.regionInteractions) {
      if (interaction.type === 'synergy') {
        this.applySynergyEffect(interaction, gameState);
      } else if (interaction.type === 'conflict') {
        this.applyConflictEffect(interaction, gameState);
      }
    }
  }

  private shouldExpireEffect(effect: RegionEffect, gameState: GameState): boolean {
    // Implementation would check if effect should expire
    return false; // Placeholder
  }

  private shouldExpireModifier(modifier: RegionModifier, gameState: GameState): boolean {
    // Implementation would check if modifier should expire
    return false; // Placeholder
  }

  private evaluateCondition(condition: string, card: Card): boolean {
    // Simple condition evaluation - would be more sophisticated
    return true; // Placeholder
  }

  private applySynergyEffect(interaction: RegionInteraction, gameState: GameState): void {
    // Implementation would apply synergy effects
  }

  private applyConflictEffect(interaction: RegionInteraction, gameState: GameState): void {
    // Implementation would apply conflict effects
  }

  private refreshTurnModifier(modifier: RegionModifier, region: RegionalZone, gameState: GameState): void {
    // Reset or refresh turn-based modifiers
    // Implementation would handle modifier refresh logic
  }

  private updateRegionTurnState(region: RegionalZone, gameState: GameState): void {
    // Update region state based on turn progression
    // Implementation would handle region state changes
  }
}

export default RegionManager;
