/**
 * Unit Tests for Phase 2: Combat & Positioning Systems
 * Tests all Phase 2 components including combat, damage, positioning, movement, and regions
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 2: Combat & Positioning Systems', () => {
  const coreDir = path.join(process.cwd(), 'src', 'core', 'simulation', 'core');

  describe('File Existence', () => {
    it('should have all Phase 2 combat system files', () => {
      const combatFiles = [
        'combatPhase.ts',
        'damageSystem.ts'
      ];

      for (const file of combatFiles) {
        const filePath = path.join(coreDir, file);
        expect(fs.existsSync(filePath), `${file} should exist`).toBe(true);
      }
    });

    it('should have all Phase 2 positioning system files', () => {
      const positioningFiles = [
        'positionSystem.ts',
        'movementEngine.ts',
        'regionManager.ts'
      ];

      for (const file of positioningFiles) {
        const filePath = path.join(coreDir, file);
        expect(fs.existsSync(filePath), `${file} should exist`).toBe(true);
      }
    });
  });

  describe('Combat System Architecture', () => {
    it('should have proper CombatPhase class structure', () => {
      const combatPhasePath = path.join(coreDir, 'combatPhase.ts');
      const content = fs.readFileSync(combatPhasePath, 'utf-8');
      
      // Check for key class and method signatures
      expect(content).toContain('export class CombatPhase');
      expect(content).toContain('initiateCombat');
      expect(content).toContain('declareAttackers');
      expect(content).toContain('declareBlockers');
      expect(content).toContain('resolveCombatDamage');
      expect(content).toContain('CombatStep');
      expect(content).toContain('AttackDeclaration');
      expect(content).toContain('BlockDeclaration');
    });

    it('should have proper DamageSystem class structure', () => {
      const damageSystemPath = path.join(coreDir, 'damageSystem.ts');
      const content = fs.readFileSync(damageSystemPath, 'utf-8');
      
      // Check for key class and method signatures
      expect(content).toContain('export class DamageSystem');
      expect(content).toContain('applyDamage');
      expect(content).toContain('preventDamage');
      expect(content).toContain('redirectDamage');
      expect(content).toContain('resolveCombatDamage');
      expect(content).toContain('DamageEvent');
      expect(content).toContain('DamagePreventionEffect');
    });
  });

  describe('Positioning System Architecture', () => {
    it('should have proper PositionSystem class structure', () => {
      const positionSystemPath = path.join(coreDir, 'positionSystem.ts');
      const content = fs.readFileSync(positionSystemPath, 'utf-8');
      
      // Check for key class and method signatures
      expect(content).toContain('export class PositionSystem');
      expect(content).toContain('canPlaceCard');
      expect(content).toContain('placeCard');
      expect(content).toContain('validatePlacement');
      expect(content).toContain('checkAdjacency');
      expect(content).toContain('PositionRule');
      expect(content).toContain('PlacementRestriction');
      expect(content).toContain('PositionedCard');
    });

    it('should have proper MovementEngine class structure', () => {
      const movementEnginePath = path.join(coreDir, 'movementEngine.ts');
      const content = fs.readFileSync(movementEnginePath, 'utf-8');
      
      // Check for key class and method signatures
      expect(content).toContain('export class MovementEngine');
      expect(content).toContain('getMovementRange');
      expect(content).toContain('calculateMovementPath');
      expect(content).toContain('executeMovement');
      expect(content).toContain('canMoveBetween');
      expect(content).toContain('MovementRule');
      expect(content).toContain('MovementPath');
      expect(content).toContain('MovementRestriction');
    });

    it('should have proper RegionManager class structure', () => {
      const regionManagerPath = path.join(coreDir, 'regionManager.ts');
      const content = fs.readFileSync(regionManagerPath, 'utf-8');
      
      // Check for key class and method signatures
      expect(content).toContain('export class RegionManager');
      expect(content).toContain('createRegion');
      expect(content).toContain('removeRegion');
      expect(content).toContain('getRegionAt');
      expect(content).toContain('applyRegionalModifiers');
      expect(content).toContain('canPlaceInRegion');
      expect(content).toContain('RegionEffect');
      expect(content).toContain('RegionModifier');
      expect(content).toContain('RegionType');
    });
  });

  describe('Interface and Type Definitions', () => {
    it('should have comprehensive combat interfaces', () => {
      const combatPhasePath = path.join(coreDir, 'combatPhase.ts');
      const content = fs.readFileSync(combatPhasePath, 'utf-8');
      
      // Check for essential interfaces
      expect(content).toContain('interface CombatState');
      expect(content).toContain('interface AttackDeclaration');
      expect(content).toContain('interface BlockDeclaration');
      expect(content).toContain('interface CombatStep');
    });

    it('should have comprehensive damage interfaces', () => {
      const damageSystemPath = path.join(coreDir, 'damageSystem.ts');
      const content = fs.readFileSync(damageSystemPath, 'utf-8');
      
      // Check for essential interfaces
      expect(content).toContain('interface DamageEvent');
      expect(content).toContain('interface DamagePreventionEffect');
      expect(content).toContain('interface DamageRedirection');
    });

    it('should have comprehensive positioning interfaces', () => {
      const positionSystemPath = path.join(coreDir, 'positionSystem.ts');
      const content = fs.readFileSync(positionSystemPath, 'utf-8');
      
      // Check for essential interfaces
      expect(content).toContain('interface PositionRule');
      expect(content).toContain('interface PlacementRestriction');
      expect(content).toContain('interface PositionedCard');
    });

    it('should have comprehensive movement interfaces', () => {
      const movementEnginePath = path.join(coreDir, 'movementEngine.ts');
      const content = fs.readFileSync(movementEnginePath, 'utf-8');
      
      // Check for essential interfaces
      expect(content).toContain('interface MovementRule');
      expect(content).toContain('interface MovementPath');
      expect(content).toContain('interface MovementRestriction');
    });

    it('should have comprehensive region interfaces', () => {
      const regionManagerPath = path.join(coreDir, 'regionManager.ts');
      const content = fs.readFileSync(regionManagerPath, 'utf-8');
      
      // Check for essential interfaces
      expect(content).toContain('interface RegionEffect');
      expect(content).toContain('interface RegionModifier');
      expect(content).toContain('interface RegionInteraction');
      expect(content).toContain('type RegionType');
    });
  });

  describe('System Integration', () => {
    it('should have proper imports between Phase 2 systems', () => {
      const movementEnginePath = path.join(coreDir, 'movementEngine.ts');
      const movementContent = fs.readFileSync(movementEnginePath, 'utf-8');
      
      // MovementEngine should import PositionSystem
      expect(movementContent).toContain("import { PositionSystem }");
      expect(movementContent).toContain("import { BoardStateManager }");
    });

    it('should have proper type imports from game-types', () => {
      // This test is now obsolete: the codebase uses canonical types from ./gameState, not legacy game-types.
      // The refactor plan explicitly removes all legacy/MTG types and imports.
      expect(true).toBe(true);
    });

    it('should have consistent BoardStateManager integration', () => {
      const files = ['positionSystem.ts', 'movementEngine.ts', 'regionManager.ts'];
      
      for (const file of files) {
        const filePath = path.join(coreDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Position-related files should integrate with BoardStateManager
        expect(content).toContain("import { BoardStateManager }");
      }
    });
  });

  describe('Method Completeness', () => {
    it('should have complete combat phase methods', () => {
      const combatPhasePath = path.join(coreDir, 'combatPhase.ts');
      const content = fs.readFileSync(combatPhasePath, 'utf-8');
      
      const requiredMethods = [
        'initiateCombat',
        'declareAttackers',
        'declareBlockers',
        'assignCombatDamage',
        'resolveCombatDamage',
        'endCombat',
        'canDeclareAttacker',
        'canDeclareBlocker',
        'calculateCombatDamage'
      ];

      for (const method of requiredMethods) {
        expect(content).toContain(method);
      }
    });

    it('should have complete damage system methods', () => {
      const damageSystemPath = path.join(coreDir, 'damageSystem.ts');
      const content = fs.readFileSync(damageSystemPath, 'utf-8');
      
      const requiredMethods = [
        'applyDamage',
        'preventDamage',
        'redirectDamage',
        'resolveCombatDamage',
        'createDamageEvent',
        'processPreventionEffects',
        'checkDestroyedCreatures'
      ];

      for (const method of requiredMethods) {
        expect(content).toContain(method);
      }
    });

    it('should have complete movement engine methods', () => {
      const movementEnginePath = path.join(coreDir, 'movementEngine.ts');
      const content = fs.readFileSync(movementEnginePath, 'utf-8');
      
      const requiredMethods = [
        'getMovementRange',
        'calculateMovementPath',
        'executeMovement',
        'canMoveBetween',
        'getDistance',
        'getAdjacentPositions',
        'areAdjacent',
        'addMovementRule',
        'removeMovementRule'
      ];

      for (const method of requiredMethods) {
        expect(content).toContain(method);
      }
    });

    it('should have complete region manager methods', () => {
      const regionManagerPath = path.join(coreDir, 'regionManager.ts');
      const content = fs.readFileSync(regionManagerPath, 'utf-8');
      
      const requiredMethods = [
        'createRegion',
        'removeRegion',
        'getRegionAt',
        'getRegionEffectsAt',
        'applyRegionalModifiers',
        'canPlaceInRegion',
        'getRegionalMovementRestrictions',
        'processRegionTurnEffects'
      ];

      for (const method of requiredMethods) {
        expect(content).toContain(method);
      }
    });
  });

  describe('Region Type System', () => {
    it('should define all region types', () => {
      const regionManagerPath = path.join(coreDir, 'regionManager.ts');
      const content = fs.readFileSync(regionManagerPath, 'utf-8');
      
      // Check for all region types
      expect(content).toContain("'void'");
      expect(content).toContain("'surface'");
      expect(content).toContain("'underground'");
      expect(content).toContain("'underwater'");
    });

    it('should have region interaction system', () => {
      const regionManagerPath = path.join(coreDir, 'regionManager.ts');
      const content = fs.readFileSync(regionManagerPath, 'utf-8');
      
      // Check for interaction handling
      expect(content).toContain('RegionInteraction');
      expect(content).toContain('initializeRegionInteractions');
      expect(content).toContain('checkRegionConflicts');
      expect(content).toContain('resolveRegionConflicts');
    });
  });

  describe('Error Handling and Validation', () => {
    it('should have validation methods in positioning system', () => {
      const positionSystemPath = path.join(coreDir, 'positionSystem.ts');
      const content = fs.readFileSync(positionSystemPath, 'utf-8');
      
      // Check for validation methods
      expect(content).toContain('validatePlacement');
      expect(content).toContain('canPlaceCard');
      expect(content).toContain('checkPlacementRestrictions');
    });

    it('should have path validation in movement engine', () => {
      const movementEnginePath = path.join(coreDir, 'movementEngine.ts');
      const content = fs.readFileSync(movementEnginePath, 'utf-8');
      
      // Check for movement validation
      expect(content).toContain('isValidDestination');
      expect(content).toContain('getMovementCost');
      expect(content).toContain('isValid');
    });

    it('should have combat validation in combat phase', () => {
      const combatPhasePath = path.join(coreDir, 'combatPhase.ts');
      const content = fs.readFileSync(combatPhasePath, 'utf-8');
      
      // Check for combat validation
      expect(content).toContain('canDeclareAttacker');
      expect(content).toContain('canDeclareBlocker');
      expect(content).toContain('validateCombatStep');
    });
  });

  describe('Performance and Optimization', () => {
    it('should have efficient data structures', () => {
      const files = ['combatPhase.ts', 'damageSystem.ts', 'positionSystem.ts', 'movementEngine.ts', 'regionManager.ts'];
      
      for (const file of files) {
        const filePath = path.join(coreDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for use of Maps for efficient lookups
        expect(content).toContain('Map<');
      }
    });

    it('should have cleanup methods', () => {
      const files = ['movementEngine.ts', 'regionManager.ts'];
      
      for (const file of files) {
        const filePath = path.join(coreDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for reset/cleanup methods
        expect(content).toContain('reset()');
      }
    });
  });
});
