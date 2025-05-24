/**
 * Combat system for Sorcery: Contested Realm match simulation
 * Handles combat resolution, intercept/defend mechanics, and damage calculation
 */

import { GameState, Unit, Position, GameEvent, Card } from './gameState';

export interface CombatModifier {
  type: 'power_bonus' | 'life_bonus' | 'damage_reduction' | 'critical_hit' | 'intercept_bonus';
  value: number;
  source: string;
  condition?: string;
}

export interface CombatAction {
  type: 'attack' | 'intercept' | 'defend' | 'use_ability';
  actorId: string;
  targetId?: string;
  targetPosition?: Position;
  abilityId?: string;
}

export interface CombatResult {
  success: boolean;
  damage: {
    attacker: number;
    defender: number;
  };
  effects: GameEvent[];
  destroyed: string[]; // Unit IDs
}

export interface InterceptChain {
  attacker: Unit;
  target: Unit;
  interceptors: Unit[];
  resolvedTarget: Unit;
}

export class CombatSystem {
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  /**
   * Initiate combat between two units
   */
  initiateCombat(attackerId: string, targetId: string): CombatResult {
    const attacker = this.gameState.units.get(attackerId);
    const defender = this.gameState.units.get(targetId);

    if (!attacker || !defender) {
      return {
        success: false,
        damage: { attacker: 0, defender: 0 },
        effects: [],
        destroyed: []
      };
    }

    // Check if combat is valid
    if (!this.canInitiateCombat(attacker, defender)) {
      return {
        success: false,
        damage: { attacker: 0, defender: 0 },
        effects: [],
        destroyed: []
      };
    }

    // Resolve intercept chain
    const interceptChain = this.resolveInterceptChain(attacker, defender);
    const actualTarget = interceptChain.resolvedTarget;

    // Calculate combat damage
    const result = this.resolveCombat(attacker, actualTarget);

    // Apply damage and check for destruction
    this.applyDamage(attacker, result.damage.attacker);
    this.applyDamage(actualTarget, result.damage.defender);

    // Check for destroyed units
    const destroyed: string[] = [];
    if (this.isUnitDestroyed(attacker)) {
      destroyed.push(attacker.id);
      this.destroyUnit(attacker.id);
    }
    if (this.isUnitDestroyed(actualTarget)) {
      destroyed.push(actualTarget.id);
      this.destroyUnit(actualTarget.id);
    }

    return {
      success: true,
      damage: result.damage,
      effects: result.effects,
      destroyed
    };
  }

  /**
   * Check if a unit can initiate combat with another unit
   */
  canInitiateCombat(attacker: Unit, defender: Unit): boolean {
    // Basic validation
    if (attacker.owner === defender.owner) return false;
    if (attacker.isTapped) return false;
    if (attacker.summoning_sickness) return false;

    // Check range and positioning
    return this.isInCombatRange(attacker.position, defender.position);
  }

  /**
   * Check if two positions are in combat range
   */
  isInCombatRange(pos1: Position, pos2: Position): boolean {
    const distance = Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    return distance <= 1; // Adjacent squares
  }

  /**
   * Resolve intercept chain to determine final target
   */
  resolveInterceptChain(attacker: Unit, originalTarget: Unit): InterceptChain {
    const interceptors: Unit[] = [];
    let currentTarget = originalTarget;

    // Find potential interceptors
    const potentialInterceptors = this.findPotentialInterceptors(attacker, originalTarget);

    // AI or player would choose interceptors here
    // For simulation, we'll use a simple priority system
    for (const interceptor of potentialInterceptors) {
      if (this.shouldIntercept(interceptor, attacker, currentTarget)) {
        interceptors.push(interceptor);
        currentTarget = interceptor;
        break; // Only one intercept per attack in basic rules
      }
    }

    return {
      attacker,
      target: originalTarget,
      interceptors,
      resolvedTarget: currentTarget
    };
  }

  /**
   * Find units that can potentially intercept an attack
   */
  findPotentialInterceptors(attacker: Unit, target: Unit): Unit[] {
    const interceptors: Unit[] = [];
    const targetOwner = target.owner;

    // Check all units belonging to the target's owner
    this.gameState.units.forEach((unit) => {
      if (unit.owner === targetOwner && 
          unit.id !== target.id && 
          this.canIntercept(unit, attacker, target)) {
        interceptors.push(unit);
      }
    });

    return interceptors;
  }

  /**
   * Check if a unit can intercept an attack
   */
  canIntercept(interceptor: Unit, attacker: Unit, target: Unit): boolean {
    // Unit must not be tapped
    if (interceptor.isTapped) return false;

    // Must have intercept ability or be in range
    if (this.hasInterceptAbility(interceptor)) return true;

    // Check if interceptor is adjacent to the attack path
    return this.isInInterceptRange(interceptor.position, attacker.position, target.position);
  }

  /**
   * Check if unit has intercept ability
   */
  hasInterceptAbility(unit: Unit): boolean {
    // Check text description for intercept ability
    const cardText = unit.card.text || unit.card.extDescription || '';
    const hasIntercept = cardText.toLowerCase().includes('intercept');
    
    // Also check unit abilities array if it exists
    const unitAbilities = unit.abilities || [];
    const hasInterceptAbility = unitAbilities.some((ability: string) => 
      ability.toLowerCase().includes('intercept')
    );
    
    return hasIntercept || hasInterceptAbility;
  }

  /**
   * Check if interceptor is in range to intercept
   */
  isInInterceptRange(interceptorPos: Position, attackerPos: Position, targetPos: Position): boolean {
    // Interceptor must be adjacent to either attacker or target
    const distToAttacker = Math.abs(interceptorPos.x - attackerPos.x) + Math.abs(interceptorPos.y - attackerPos.y);
    const distToTarget = Math.abs(interceptorPos.x - targetPos.x) + Math.abs(interceptorPos.y - targetPos.y);
    
    return distToAttacker <= 1 || distToTarget <= 1;
  }

  /**
   * AI decision for whether to intercept
   */
  shouldIntercept(interceptor: Unit, attacker: Unit, target: Unit): boolean {
    // Simple AI logic - intercept if interceptor can survive and target is valuable
    const interceptorPower = this.getUnitPower(interceptor);
    const attackerPower = this.getUnitPower(attacker);
    const targetValue = this.getUnitValue(target);
    const interceptorValue = this.getUnitValue(interceptor);

    // Intercept if target is more valuable and interceptor can survive
    return targetValue > interceptorValue && interceptorPower >= attackerPower;
  }

  /**
   * Resolve combat between two units
   */
  resolveCombat(attacker: Unit, defender: Unit): CombatResult {
    const attackerPower = this.getModifiedPower(attacker, defender);
    const defenderPower = this.getModifiedPower(defender, attacker);

    const effects: GameEvent[] = [];
    
    // Apply pre-combat effects
    const preEffects = this.applyPreCombatEffects(attacker, defender);
    effects.push(...preEffects);

    // Calculate damage
    const attackerDamage = Math.max(0, defenderPower);
    const defenderDamage = Math.max(0, attackerPower);

    // Apply combat modifiers
    const modifiedDamage = this.applyCombatModifiers(
      { attacker: attackerDamage, defender: defenderDamage },
      attacker,
      defender
    );

    return {
      success: true,
      damage: modifiedDamage,
      effects,
      destroyed: []
    };
  }

  /**
   * Get unit's base power
   */
  getUnitPower(unit: Unit): number {
    return unit.card.power || unit.power || 0;
  }

  /**
   * Get unit's base life
   */
  getUnitLife(unit: Unit): number {
    return (unit.card.life || unit.life || 0) - unit.damage;
  }

  /**
   * Get unit's strategic value for AI decisions
   */
  getUnitValue(unit: Unit): number {
    const power = this.getUnitPower(unit);
    const life = this.getUnitLife(unit);
    const cost = unit.card.cost || unit.cost || 0;
    
    // Simple value calculation
    return power + life + (cost * 0.5);
  }

  /**
   * Get modified power considering combat modifiers
   */
  getModifiedPower(unit: Unit, opponent: Unit): number {
    let power = this.getUnitPower(unit);

    // Apply unit modifiers
    unit.modifiers.forEach(modifier => {
      if (modifier.type === 'power' && typeof modifier.value === 'number') {
        power += modifier.value;
      }
    });

    // Apply situational modifiers
    power += this.getSituationalPowerBonus(unit, opponent);

    return Math.max(0, power);
  }

  /**
   * Get situational power bonuses
   */
  getSituationalPowerBonus(unit: Unit, opponent: Unit): number {
    let bonus = 0;

    // Element interactions
    const unitElements = unit.card.elements || unit.elements || [];
    const opponentElements = opponent.card.elements || opponent.elements || [];

    // Add element-based bonuses here based on game rules
    // This is a placeholder for element interaction rules

    return bonus;
  }

  /**
   * Apply pre-combat effects
   */
  applyPreCombatEffects(attacker: Unit, defender: Unit): GameEvent[] {
    const effects: GameEvent[] = [];

    // Apply abilities that trigger on combat
    // This would include things like "when this unit attacks" or "when this unit defends"
    
    return effects;
  }

  /**
   * Apply combat modifiers to damage
   */
  applyCombatModifiers(
    damage: { attacker: number; defender: number },
    attacker: Unit,
    defender: Unit
  ): { attacker: number; defender: number } {
    let modifiedDamage = { ...damage };

    // Apply damage reduction
    const attackerReduction = this.getDamageReduction(attacker);
    const defenderReduction = this.getDamageReduction(defender);

    modifiedDamage.attacker = Math.max(0, modifiedDamage.attacker - attackerReduction);
    modifiedDamage.defender = Math.max(0, modifiedDamage.defender - defenderReduction);

    return modifiedDamage;
  }

  /**
   * Get damage reduction for a unit
   */
  getDamageReduction(unit: Unit): number {
    let reduction = 0;

    unit.modifiers.forEach(modifier => {
      if (modifier.type === 'damage_reduction' && typeof modifier.value === 'number') {
        reduction += modifier.value;
      }
    });

    return reduction;
  }

  /**
   * Apply damage to a unit
   */
  applyDamage(unit: Unit, damage: number): void {
    unit.damage += damage;
  }

  /**
   * Check if a unit is destroyed
   */
  isUnitDestroyed(unit: Unit): boolean {
    const currentLife = this.getUnitLife(unit);
    return currentLife <= 0;
  }

  /**
   * Destroy a unit
   */
  destroyUnit(unitId: string): void {
    const unit = this.gameState.units.get(unitId);
    if (!unit) return;

    // Remove from grid
    const gridSquare = this.gameState.grid[unit.position.y][unit.position.x];
    const unitIndex = gridSquare.units.findIndex(u => u.id === unitId);
    if (unitIndex >= 0) {
      gridSquare.units.splice(unitIndex, 1);
    }

    // Move to cemetery
    const player = this.gameState.players[unit.owner];
    player.cemetery.push(unit.card);

    // Remove from units map
    this.gameState.units.delete(unitId);
  }

  /**
   * Get all units that can attack this turn
   */
  getAttackingUnits(playerId: 'player1' | 'player2'): Unit[] {
    const attackers: Unit[] = [];

    this.gameState.units.forEach((unit) => {
      if (unit.owner === playerId && 
          !unit.isTapped && 
          !unit.summoning_sickness &&
          this.getUnitPower(unit) > 0) {
        attackers.push(unit);
      }
    });

    return attackers;
  }

  /**
   * Get valid attack targets for a unit
   */
  getValidTargets(attackerId: string): Unit[] {
    const attacker = this.gameState.units.get(attackerId);
    if (!attacker) return [];

    const targets: Unit[] = [];
    const opponentId = attacker.owner === 'player1' ? 'player2' : 'player1';

    this.gameState.units.forEach((unit) => {
      if (unit.owner === opponentId && this.isInCombatRange(attacker.position, unit.position)) {
        targets.push(unit);
      }
    });

    return targets;
  }
}
