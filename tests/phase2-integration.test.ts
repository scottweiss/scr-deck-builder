/**
 * Phase 2 Integration Tests - Complex Scenarios
 * Tests the integration of Combat, Positioning, Movement, and Regional systems
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CombatPhase, AttackDeclaration } from '../src/core/simulation/core/combatPhase';
import { DamageSystem, DamageSource, DamageTarget } from '../src/core/simulation/core/damageSystem';
import { PositionSystem } from '../src/core/simulation/core/positionSystem';
import { MovementEngine, MovementResult } from '../src/game/systems/positioning/movementEngine';
import { RegionManager, RegionType } from '../src/core/simulation/core/regionManager';
import { BoardStateManager } from '../src/core/simulation/core/boardState';
import { ActionStack } from '../src/core/simulation/core/actionStack';
import { PrioritySystem } from '../src/core/simulation/core/prioritySystem';
import { Card } from '../src/types/card-types';
import { GameState, Player, BoardPosition } from '../src/types/game-types';

describe('Phase 2 Integration Tests - Complex Scenarios', () => {
  let combatPhase: CombatPhase;
  let damageSystem: DamageSystem;
  let positionSystem: PositionSystem;
  let movementEngine: MovementEngine;
  let regionManager: RegionManager;
  let boardState: BoardStateManager;
  let actionStack: ActionStack;
  let prioritySystem: PrioritySystem;
  let gameState: GameState;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    // Initialize dependencies with configuration
    const boardConfig = {
      width: 5,
      height: 4,
      regions: []
    };
    boardState = new BoardStateManager(boardConfig);
    positionSystem = new PositionSystem(boardState);
    actionStack = new ActionStack();
    prioritySystem = new PrioritySystem(actionStack);
    
    // Initialize Phase 2 systems with correct constructor parameters
    combatPhase = new CombatPhase(actionStack, prioritySystem, boardState);
    damageSystem = new DamageSystem();
    movementEngine = new MovementEngine(positionSystem, boardState);
    regionManager = new RegionManager(boardState);

    // Create test players
    player1 = {
      id: 'player1',
      name: 'Test Player 1',
      health: 20,
      hand: [],
      battlefield: [],
      graveyard: [],
      manaPool: { red: 5, blue: 5, green: 5, white: 5, black: 5, colorless: 5 },
      statistics: {
        damageDealt: 0,
        damageTaken: 0,
        cardsDrawn: 0,
        spellsCast: 0,
        creaturesPlayed: 0,
        turnsPlayed: 0
      },
      continuousEffects: [],
      turnModifiers: []
    };

    player2 = {
      id: 'player2',
      name: 'Test Player 2',
      health: 20,
      hand: [],
      battlefield: [],
      graveyard: [],
      manaPool: { red: 5, blue: 5, green: 5, white: 5, black: 5, colorless: 5 },
      statistics: {
        damageDealt: 0,
        damageTaken: 0,
        cardsDrawn: 0,
        spellsCast: 0,
        creaturesPlayed: 0,
        turnsPlayed: 0
      },
      continuousEffects: [],
      turnModifiers: []
    };

    // Create test game state
    gameState = {
      id: 'test-game',
      players: [player1, player2],
      currentPlayer: 'player1',
      turnNumber: 1,
      phase: 'main',
      board: Array(5).fill(null).map(() => Array(4).fill(null)),
      stack: [],
      gameEnded: false
    };
  });

  describe('Complex Combat with Regional Effects', () => {
    it('should handle combat between units in different regions', () => {
      // Create test creatures
      const creature1: Card = {
        id: 'creature1',
        name: 'Fire Warrior',
        type: 'Creature',
        cost: 3,
        keywords: ['Fire Affinity'],
        subtypes: ['Warrior']
      };

      const creature2: Card = {
        id: 'creature2',
        name: 'Water Elemental',
        type: 'Creature',
        cost: 3,
        keywords: ['Aquatic'],
        subtypes: ['Elemental']
      };

      // Set up positions
      const pos1: BoardPosition = { row: 1, col: 1 };
      const pos2: BoardPosition = { row: 1, col: 2 };

      // Place creatures on battlefield
      expect(positionSystem.placeCard(creature1, pos1, player1, gameState)).toBe(true);
      expect(positionSystem.placeCard(creature2, pos2, player2, gameState)).toBe(true);

      // Create different regions
      expect(regionManager.createRegion('fire-region', 'surface', [pos1], player1.id)).toBe(true);
      expect(regionManager.createRegion('water-region', 'underwater', [pos2], player2.id)).toBe(true);

      // Apply regional modifiers
      const modifiers1 = regionManager.applyRegionalModifiers(creature1, pos1, gameState);
      const modifiers2 = regionManager.applyRegionalModifiers(creature2, pos2, gameState);

      expect(modifiers1).toBeDefined();
      expect(modifiers2).toBeDefined();

      // Check region effects
      const effects1 = regionManager.getActiveEffects(pos1);
      const effects2 = regionManager.getActiveEffects(pos2);

      expect(effects1.length).toBeGreaterThan(0);
      expect(effects2.length).toBeGreaterThan(0);    // Verify combat can be declared between regions
    const attackerIds = [creature1.id];
    const targets = { [creature1.id]: creature2.id };
    const declareResult = combatPhase.declareAttackers(attackerIds, targets, gameState);

    expect(declareResult).toBe(true);
    expect(combatPhase.startCombatPhase('player1', gameState)).toBeDefined();
    });

    it('should handle movement restrictions during combat', () => {
      const creature: Card = {
        id: 'mobile-creature',
        name: 'Swift Scout',
        type: 'Creature',
        cost: 2,
        keywords: ['Swift'],
        subtypes: ['Scout']
      };

      const startPos: BoardPosition = { row: 0, col: 0 };
      const targetPos: BoardPosition = { row: 2, col: 2 };

      // Place creature
      expect(positionSystem.placeCard(creature, startPos, player1, gameState)).toBe(true);

      // Create void region that restricts movement
      expect(regionManager.createRegion('void-zone', 'void', [{ row: 1, col: 1 }], undefined)).toBe(true);

      // Check movement restrictions
      const restrictions = regionManager.getRegionalMovementRestrictions({ row: 1, col: 1 }, creature);
      expect(restrictions.length).toBeGreaterThan(0);
      expect(restrictions[0]).toContain('Void energy interferes');

      // Try to move through void region
      const path = movementEngine.calculateMovementPath(startPos, targetPos, creature.id, gameState);
      
      // Movement should be affected by regional restrictions
      expect(path).toBeDefined();
      
      // Verify movement validation considers regional effects
      const canMove = movementEngine.isValidDestination(creature.id, targetPos, gameState);
      expect(typeof canMove).toBe('boolean');
    });

    it('should resolve region conflicts during combat', () => {
      const creature1: Card = {
        id: 'void-creature',
        name: 'Void Stalker',
        type: 'Creature',
        cost: 4,
        keywords: ['Void Affinity'],
        subtypes: ['Horror']
      };

      const creature2: Card = {
        id: 'surface-creature',
        name: 'Surface Knight',
        type: 'Creature',
        cost: 4,
        keywords: [],
        subtypes: ['Knight']
      };

      const pos1: BoardPosition = { row: 2, col: 1 };
      const pos2: BoardPosition = { row: 2, col: 2 };

      // Place creatures
      expect(positionSystem.placeCard(creature1, pos1, player1, gameState)).toBe(true);
      expect(positionSystem.placeCard(creature2, pos2, player2, gameState)).toBe(true);

      // Create conflicting regions
      expect(regionManager.createRegion('void-area', 'void', [pos1], player1.id)).toBe(true);
      expect(regionManager.createRegion('surface-area', 'surface', [pos2], player2.id)).toBe(true);

      // Check for region conflicts
      const conflicts1 = regionManager.checkRegionConflicts(pos1);
      const conflicts2 = regionManager.checkRegionConflicts(pos2);

      // Adjacent void and surface regions should have conflicts
      expect(conflicts1.length + conflicts2.length).toBeGreaterThan(0);

      // Resolve conflicts
      const resolved = regionManager.resolveRegionConflicts(pos1, gameState);
      expect(resolved).toBeDefined();
      expect(Array.isArray(resolved)).toBe(true);
    });
  });

  describe('Multi-System Movement and Combat Integration', () => {
    it('should handle complex movement with combat aftermath', () => {
      // Create multiple creatures for complex scenario
      const attacker: Card = {
        id: 'attacker',
        name: 'Lightning Drake',
        type: 'Creature',
        cost: 5,
        keywords: ['Flying', 'Swift'],
        subtypes: ['Dragon']
      };

      const defender: Card = {
        id: 'defender',
        name: 'Stone Guardian',
        type: 'Creature',
        cost: 4,
        keywords: ['Defender'],
        subtypes: ['Construct']
      };

      const blocker: Card = {
        id: 'blocker',
        name: 'Shield Bearer',
        type: 'Creature',
        cost: 2,
        keywords: ['Defender'],
        subtypes: ['Soldier']
      };

      // Set up initial positions
      const attackerPos: BoardPosition = { row: 0, col: 0 };
      const defenderPos: BoardPosition = { row: 3, col: 3 };
      const blockerPos: BoardPosition = { row: 2, col: 2 };

      // Place all creatures
      expect(positionSystem.placeCard(attacker, attackerPos, player1, gameState)).toBe(true);
      expect(positionSystem.placeCard(defender, defenderPos, player2, gameState)).toBe(true);
      expect(positionSystem.placeCard(blocker, blockerPos, player2, gameState)).toBe(true);

      // Create regions with different effects
      expect(regionManager.createRegion('air-region', 'surface', [attackerPos], player1.id)).toBe(true);
      expect(regionManager.createRegion('ground-region', 'surface', [defenderPos, blockerPos], player2.id)).toBe(true);

      // Calculate movement range for attacker
      const moveRange = movementEngine.getMovementRange(attacker.id, gameState);
      expect(moveRange.length).toBeGreaterThan(0);

      // Move attacker closer to combat
      const newPos: BoardPosition = { row: 1, col: 1 };
      if (moveRange.some(pos => pos.row === newPos.row && pos.col === newPos.col)) {
        const moveResult = movementEngine.executeMovement(attacker.id, newPos, gameState);
        expect(moveResult.success).toBe(true);
      }

      // Declare combat with attacker targeting defender
      const attackerIds = [attacker.id];
      const targets = { [attacker.id]: defender.id };
      const declareResult = combatPhase.declareAttackers(attackerIds, targets, gameState);

      expect(declareResult).toBe(true);
      
      // Simulate damage
      const attackerSource: DamageSource = {
        type: 'creature',
        sourceId: attacker.id,
        sourceName: attacker.name,
        controller: player1.id
      };
      
      const defenderTarget: DamageTarget = {
        type: 'creature',
        id: defender.id,
        name: defender.name
      };
      
      const damageInstance = damageSystem.applyDamage(
        attackerSource,
        defenderTarget,
        4,
        gameState
      );

      expect(damageInstance).toBeDefined();
    });

    it('should validate positioning constraints during complex scenarios', () => {
      // Test adjacency rules with multiple systems
      const cards: Card[] = [
        {
          id: 'card1',
          name: 'Test Card 1',
          type: 'Creature',
          cost: 1,
          subtypes: ['Test']
        },
        {
          id: 'card2',
          name: 'Test Card 2',
          type: 'Site',
          cost: 2,
          subtypes: ['Location']
        },
        {
          id: 'card3',
          name: 'Test Card 3',
          type: 'Creature',
          cost: 3,
          subtypes: ['Test']
        }
      ];

      // Place cards with adjacency requirements
      const positions: BoardPosition[] = [
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 1, col: 3 }
      ];

      // Test placement validation
      for (let i = 0; i < cards.length; i++) {
        const canPlace = positionSystem.canPlaceCard(cards[i], positions[i], player1.id, gameState);
        expect(typeof canPlace).toBe('boolean');

        if (canPlace) {
          expect(positionSystem.placeCard(cards[i], positions[i], player1, gameState)).toBe(true);
        }
      }

      // Test adjacency calculations
      if (cards.length >= 2) {
        const adjacent = positionSystem.getAdjacentCards(positions[0], gameState);
        expect(Array.isArray(adjacent)).toBe(true);

        // Check if adjacency affects region placement
        const restrictions = regionManager.getPlacementRestrictions(positions[1], cards[1]);
        expect(Array.isArray(restrictions)).toBe(true);
      }
    });
  });

  describe('Regional Effect Interactions', () => {
    it('should handle turn-based regional effects with combat', () => {
      const creature: Card = {
        id: 'region-creature',
        name: 'Adaptive Warrior',
        type: 'Creature',
        cost: 3,
        keywords: ['Adaptive'],
        subtypes: ['Warrior']
      };

      const position: BoardPosition = { row: 2, col: 2 };

      // Place creature
      expect(positionSystem.placeCard(creature, position, player1, gameState)).toBe(true);

      // Create region with turn-based effects
      expect(regionManager.createRegion('temporal-zone', 'void', [position], player1.id)).toBe(true);

      // Process turn effects
      regionManager.processRegionTurnEffects(gameState);

      // Verify effects were processed
      const effects = regionManager.getActiveEffects(position);
      expect(effects.length).toBeGreaterThan(0);

      // Test that combat can still occur after regional processing
      const otherCreature: Card = {
        id: 'other-creature',
        name: 'Test Opponent',
        type: 'Creature',
        cost: 2,
        subtypes: ['Test']
      };

      const otherPos: BoardPosition = { row: 3, col: 2 };
      expect(positionSystem.placeCard(otherCreature, otherPos, player2, gameState)).toBe(true);

      // Declare combat after regional effects
      const attackerIds = [creature.id];
      const targets = { [creature.id]: otherCreature.id };
      const declareResult = combatPhase.declareAttackers(attackerIds, targets, gameState);
      
      expect(declareResult).toBe(true);
    });

    it('should validate placement restrictions across all systems', () => {
      const restrictedCard: Card = {
        id: 'restricted-card',
        name: 'Surface Specialist',
        type: 'Creature',
        cost: 3,
        keywords: [], // No special keywords
        subtypes: ['Specialist']
      };

      // Create various region types
      const positions = [
        { row: 0, col: 0 }, // surface
        { row: 0, col: 1 }, // underwater  
        { row: 0, col: 2 }, // underground
        { row: 0, col: 3 }  // void
      ];

      expect(regionManager.createRegion('test-surface', 'surface', [positions[0]], undefined)).toBe(true);
      expect(regionManager.createRegion('test-underwater', 'underwater', [positions[1]], undefined)).toBe(true);
      expect(regionManager.createRegion('test-underground', 'underground', [positions[2]], undefined)).toBe(true);
      expect(regionManager.createRegion('test-void', 'void', [positions[3]], undefined)).toBe(true);

      // Test placement restrictions for each region type
      positions.forEach((pos, index) => {
        const restrictions = regionManager.getPlacementRestrictions(pos, restrictedCard);
        expect(Array.isArray(restrictions)).toBe(true);

        // Card without special keywords should have restrictions in special regions
        if (index > 0) { // Non-surface regions
          expect(restrictions.length).toBeGreaterThan(0);
        }

        // Test if position system agrees
        const canPlace = positionSystem.canPlaceCard(restrictedCard, pos, player1.id, gameState);
        expect(typeof canPlace).toBe('boolean');
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large-scale regional operations efficiently', () => {
      const startTime = performance.now();

      // Create many regions
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 4; col++) {
          const regionId = `region-${row}-${col}`;
          const regionType = ['surface', 'underground', 'underwater', 'void'][col] as any;
          regionManager.createRegion(regionId, regionType, [{ row, col }], undefined);
        }
      }

      // Create many creatures
      const creatures: Card[] = [];
      for (let i = 0; i < 20; i++) {
        const creature: Card = {
          id: `creature-${i}`,
          name: `Test Creature ${i}`,
          type: 'Creature',
          cost: (i % 5) + 1,
          keywords: i % 4 === 0 ? ['Aquatic'] : [],
          subtypes: ['Test']
        };
        creatures.push(creature);

        // Try to place creature
        const position: BoardPosition = { row: i % 5, col: Math.floor(i / 5) % 4 };
        if (positionSystem.canPlaceCard(creature, position, player1.id, gameState)) {
          positionSystem.placeCard(creature, position, player1, gameState);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);

      // Verify all systems still work
      expect(regionManager.getRegionAt({ row: 0, col: 0 })).toBeDefined();
      expect(positionSystem.getPlayerCards(player1.id).length).toBeGreaterThan(0);
    });

    it('should handle edge cases gracefully', () => {
      // Test invalid positions
      const invalidPos: BoardPosition = { row: -1, col: -1 };
      
      expect(() => {
        regionManager.getRegionAt(invalidPos);
      }).not.toThrow();

      expect(() => {
        positionSystem.getAdjacentCards(invalidPos, gameState);
      }).not.toThrow();

      // Test with empty game state
      const emptyGameState: GameState = {
        id: 'empty',
        players: [],
        currentPlayer: '',
        turnNumber: 0,
        phase: 'main',
        board: Array(5).fill(null).map(() => Array(4).fill(null)),
        stack: [],
        gameEnded: false
      };

      expect(() => {
        regionManager.processRegionTurnEffects(emptyGameState);
      }).not.toThrow();

      expect(() => {
        combatPhase.startCombatPhase('player1', emptyGameState);
      }).not.toThrow();
    });
  });

  describe('System Cleanup and Reset', () => {
    it('should properly reset all systems', () => {
      // Set up some state
      const creature: Card = {
        id: 'cleanup-test',
        name: 'Cleanup Test',
        type: 'Creature',
        cost: 1,
        subtypes: ['Test']
      };

      const position: BoardPosition = { row: 1, col: 1 };

      positionSystem.placeCard(creature, position, player1, gameState);
      regionManager.createRegion('cleanup-region', 'surface', [position], player1.id);
      // Start combat phase (instead of declareCombat which doesn't exist)
      combatPhase.startCombatPhase('player1', gameState);

      // Reset all systems
      positionSystem.reset();
      regionManager.reset();
      combatPhase.reset();
      damageSystem.reset();

      // Verify clean state
      expect(positionSystem.getPlayerCards('player1').length).toBe(0);
      expect(regionManager.getRegionAt(position)).toBe('surface'); // Default region
      
      // Systems should still be functional after reset
      expect(positionSystem.canPlaceCard(creature, position, player1.id, gameState)).toBe(true);
      expect(regionManager.createRegion('new-region', 'void', [position], undefined)).toBe(true);
    });
  });
});
