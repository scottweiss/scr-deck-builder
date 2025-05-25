/**
 * Damage System for Sorcery TCG
 * Handles all damage calculation, prevention, redirection, and special damage types
 */

import { Player, GameState } from '../../../types/game-types';
import { Card } from '../../../types/Card';

export interface DamageSource {
  type: 'creature' | 'spell' | 'ability' | 'burn' | 'combat';
  sourceId: string;
  sourceName: string;
  controller: string;
}

export interface DamageInstance {
  id: string;
  source: DamageSource;
  target: DamageTarget;
  amount: number;
  originalAmount: number;
  damageType: DamageType;
  timestamp: number;
  prevented: number;
  redirected?: DamageRedirection;
  modifiers: DamageModifier[];
}

export interface DamageEvent {
  id: string;
  source: DamageSource;
  target: DamageTarget;
  amount: number;
  originalAmount: number;
  damageType: DamageType;
  timestamp: number;
  prevented: boolean;
  redirected: boolean;
  resolved: boolean;
}

export interface DamageTarget {
  type: 'player' | 'creature' | 'planeswalker';
  id: string;
  name: string;
}

export interface DamageRedirection {
  originalTarget: DamageTarget;
  newTarget: DamageTarget;
  sourceId: string;
  reason: string;
}

export interface DamageModifier {
  type: 'prevention' | 'reduction' | 'amplification' | 'replacement';
  amount: number;
  sourceId: string;
  condition?: string;
}

export type DamageType = 'combat' | 'spell' | 'ability' | 'burn' | 'lethal' | 'infect' | 'commander';

export interface DamagePreventionEffect {
  id: string;
  sourceId: string;
  type: 'shield' | 'prevention' | 'immunity' | 'protection';
  amount: number; // -1 for infinite
  targets: string[];
  conditions: string[];
  duration: 'turn' | 'permanent' | 'single-use';
  used: boolean;
}

export interface CreatureDamage {
  creatureId: string;
  damage: number;
  markedThisTurn: number;
  lethalDamage: boolean;
  destroyed: boolean;
}

export class DamageSystem {
  private preventionEffects: DamagePreventionEffect[] = [];
  private creatureDamage: Map<string, CreatureDamage> = new Map();
  private damageHistory: DamageInstance[] = [];
  private damageReplacements: Map<string, Function> = new Map();
  private damageModifiers: any[] = [];
  private damagePreventers: any[] = [];

  /**
   * Reset the damage system state
   */
  public reset(): void {
    this.damageHistory = [];
    this.damageModifiers = [];
    this.damagePreventers = [];
    this.preventionEffects = [];
    this.creatureDamage.clear();
    this.damageReplacements.clear();
  }

  /**
   * Deal damage to a target
   */
  dealDamage(
    source: DamageSource,
    target: DamageTarget,
    amount: number,
    damageType: DamageType = 'spell',
    gameState: GameState
  ): DamageInstance {
    const damageInstance: DamageInstance = {
      id: this.generateDamageId(),
      source,
      target,
      amount,
      originalAmount: amount,
      damageType,
      timestamp: Date.now(),
      prevented: 0,
      modifiers: []
    };

    // Apply damage modifiers and prevention
    this.applyDamageModifiers(damageInstance, gameState);

    // Apply prevention effects
    this.applyDamagePrevention(damageInstance, gameState);

    // Deal the final damage
    this.applyFinalDamage(damageInstance, gameState);

    // Record the damage
    this.damageHistory.push(damageInstance);

    return damageInstance;
  }

  /**
   * Deal combat damage between two creatures
   */
  dealCombatDamage(
    attacker: Card,
    defender: Card,
    gameState: GameState,
    isFirstStrike: boolean = false
  ): { attackerDamage: DamageInstance; defenderDamage: DamageInstance } {
    const attackerPower = this.getCreaturePower(attacker);
    const defenderPower = this.getCreaturePower(defender);

    // Create damage sources
    const attackerSource: DamageSource = {
      type: 'creature',
      sourceId: attacker.id,
      sourceName: attacker.name,
      controller: this.getCardController(attacker, gameState)
    };

    const defenderSource: DamageSource = {
      type: 'creature',
      sourceId: defender.id,
      sourceName: defender.name,
      controller: this.getCardController(defender, gameState)
    };

    // Create damage targets
    const attackerTarget: DamageTarget = {
      type: 'creature',
      id: attacker.id,
      name: attacker.name
    };

    const defenderTarget: DamageTarget = {
      type: 'creature',
      id: defender.id,
      name: defender.name
    };

    // Deal damage to defender
    const defenderDamage = this.dealDamage(
      attackerSource,
      defenderTarget,
      attackerPower,
      'combat',
      gameState
    );

    // Deal damage to attacker (unless first strike and defender doesn't have first strike)
    let attackerDamage: DamageInstance;
    
    if (isFirstStrike && !this.hasFirstStrike(defender)) {
      // Defender doesn't deal damage back during first strike
      attackerDamage = this.createNullDamage(defenderSource, attackerTarget);
    } else {
      attackerDamage = this.dealDamage(
        defenderSource,
        attackerTarget,
        defenderPower,
        'combat',
        gameState
      );
    }

    return { attackerDamage, defenderDamage };
  }

  /**
   * Deal damage to a player
   */
  dealPlayerDamage(
    source: DamageSource,
    playerId: string,
    amount: number,
    gameState: GameState
  ): DamageInstance {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const target: DamageTarget = {
      type: 'player',
      id: playerId,
      name: player.name
    };

    return this.dealDamage(source, target, amount, 'spell', gameState);
  }

  /**
   * Apply damage to targets (used by combat system)
   */
  applyDamage(
    source: DamageSource,
    target: DamageTarget,
    amount: number,
    gameState: GameState
  ): DamageInstance {
    return this.dealDamage(source, target, amount, 'combat', gameState);
  }

  /**
   * Prevent damage by a specific amount
   */
  preventDamage(
    damageId: string,
    amount: number,
    sourceId: string
  ): boolean {
    const damageInstance = this.damageHistory.find(d => d.id === damageId);
    if (!damageInstance) return false;

    const actualPrevention = Math.min(amount, damageInstance.amount);
    damageInstance.amount -= actualPrevention;
    damageInstance.prevented += actualPrevention;

    damageInstance.modifiers.push({
      type: 'prevention',
      amount: actualPrevention,
      sourceId
    });

    return true;
  }

  /**
   * Redirect damage to a different target
   */
  redirectDamage(
    damageId: string,
    newTarget: DamageTarget,
    sourceId: string,
    reason: string
  ): boolean {
    const damageInstance = this.damageHistory.find(d => d.id === damageId);
    if (!damageInstance) return false;

    damageInstance.redirected = {
      originalTarget: damageInstance.target,
      newTarget,
      sourceId,
      reason
    };

    damageInstance.target = newTarget;
    return true;
  }

  /**
   * Resolve combat damage between attackers and blockers
   */
  resolveCombatDamage(
    combatPairs: Array<{ attacker: Card; defender: Card }>,
    gameState: GameState,
    isFirstStrike: boolean = false
  ): DamageInstance[] {
    const results: DamageInstance[] = [];

    for (const pair of combatPairs) {
      const { attackerDamage, defenderDamage } = this.dealCombatDamage(
        pair.attacker,
        pair.defender,
        gameState,
        isFirstStrike
      );
      
      results.push(attackerDamage, defenderDamage);
    }

    return results;
  }

  /**
   * Create a damage event for tracking and effects
   */
  createDamageEvent(
    source: DamageSource,
    target: DamageTarget,
    amount: number,
    damageType: DamageType = 'spell'
  ): DamageEvent {
    return {
      id: this.generateDamageId(),
      source,
      target,
      amount,
      originalAmount: amount,
      damageType,
      timestamp: Date.now(),
      prevented: false,
      redirected: false,
      resolved: false
    };
  }

  /**
   * Process prevention effects on damage
   */
  processPreventionEffects(damage: DamageInstance, gameState: GameState): void {
    this.applyDamagePrevention(damage, gameState);
  }

  /**
   * Check for destroyed creatures after damage
   */
  checkDestroyedCreatures(gameState: GameState): string[] {
    const destroyed: string[] = [];
    
    for (const [creatureId, damage] of this.creatureDamage.entries()) {
      if (this.hasLethalDamage(creatureId, gameState)) {
        destroyed.push(creatureId);
        damage.destroyed = true;
      }
    }
    
    return destroyed;
  }

  /**
   * Mark damage on a creature
   */
  markCreatureDamage(creatureId: string, damage: number): void {
    let creatureDamage = this.creatureDamage.get(creatureId);
    
    if (!creatureDamage) {
      creatureDamage = {
        creatureId,
        damage: 0,
        markedThisTurn: 0,
        lethalDamage: false,
        destroyed: false
      };
      this.creatureDamage.set(creatureId, creatureDamage);
    }

    creatureDamage.damage += damage;
    creatureDamage.markedThisTurn += damage;
  }

  /**
   * Check if a creature has lethal damage
   */
  hasLethalDamage(creatureId: string, gameState: GameState): boolean {
    const damage = this.creatureDamage.get(creatureId);
    if (!damage) return false;

    const creature = this.findCreatureById(creatureId, gameState);
    if (!creature) return false;

    const toughness = this.getCreatureToughness(creature);
    return damage.damage >= toughness;
  }

  /**
   * Get total damage marked on a creature
   */
  getCreatureDamage(creatureId: string): number {
    const damage = this.creatureDamage.get(creatureId);
    return damage ? damage.damage : 0;
  }

  /**
   * Clear damage from a creature
   */
  healCreatureDamage(creatureId: string, amount: number): void {
    const damage = this.creatureDamage.get(creatureId);
    if (damage) {
      damage.damage = Math.max(0, damage.damage - amount);
    }
  }

  /**
   * Clear all damage at end of turn
   */
  clearEndOfTurnDamage(): void {
    for (const [creatureId, damage] of this.creatureDamage.entries()) {
      damage.damage = 0;
      damage.markedThisTurn = 0;
      damage.lethalDamage = false;
    }
  }

  /**
   * Add a damage prevention effect
   */
  addPreventionEffect(effect: DamagePreventionEffect): void {
    this.preventionEffects.push(effect);
  }

  /**
   * Remove expired prevention effects
   */
  cleanupPreventionEffects(): void {
    this.preventionEffects = this.preventionEffects.filter(effect => {
      return !effect.used && effect.duration !== 'single-use';
    });
  }

  /**
   * Check if damage can be prevented
   */
  canPreventDamage(
    damage: DamageInstance,
    gameState: GameState
  ): { canPrevent: boolean; preventionAmount: number; effects: DamagePreventionEffect[] } {
    const applicableEffects = this.preventionEffects.filter(effect => 
      this.isPreventionApplicable(effect, damage, gameState)
    );

    const totalPrevention = applicableEffects.reduce((total, effect) => {
      return total + (effect.amount === -1 ? damage.amount : Math.min(effect.amount, damage.amount));
    }, 0);

    return {
      canPrevent: totalPrevention > 0,
      preventionAmount: Math.min(totalPrevention, damage.amount),
      effects: applicableEffects
    };
  }

  /**
   * Get damage history for replay/undo
   */
  getDamageHistory(): DamageInstance[] {
    return [...this.damageHistory];
  }

  // Private helper methods

  private applyDamageModifiers(damage: DamageInstance, gameState: GameState): void {
    // Apply amplification effects (like Furnace of Rath)
    const amplifiers = this.findDamageAmplifiers(damage, gameState);
    for (const amplifier of amplifiers) {
      damage.amount = Math.floor(damage.amount * amplifier.multiplier);
      damage.modifiers.push({
        type: 'amplification',
        amount: damage.amount - damage.originalAmount,
        sourceId: amplifier.sourceId
      });
    }

    // Apply reduction effects
    const reducers = this.findDamageReducers(damage, gameState);
    for (const reducer of reducers) {
      const reduction = Math.min(damage.amount, reducer.amount);
      damage.amount -= reduction;
      damage.modifiers.push({
        type: 'reduction',
        amount: reduction,
        sourceId: reducer.sourceId
      });
    }
  }

  private applyDamagePrevention(damage: DamageInstance, gameState: GameState): void {
    const prevention = this.canPreventDamage(damage, gameState);
    
    if (prevention.canPrevent) {
      damage.prevented = prevention.preventionAmount;
      damage.amount -= damage.prevented;
      
      // Mark prevention effects as used
      for (const effect of prevention.effects) {
        if (effect.duration === 'single-use') {
          effect.used = true;
        } else if (effect.amount > 0) {
          effect.amount -= Math.min(effect.amount, damage.prevented);
        }
      }
    }
  }

  private applyFinalDamage(damage: DamageInstance, gameState: GameState): void {
    if (damage.amount <= 0) return;

    switch (damage.target.type) {
      case 'player':
        this.applyPlayerDamage(damage, gameState);
        break;
        
      case 'creature':
        this.applyCreatureDamage(damage, gameState);
        break;
        
      case 'planeswalker':
        this.applyPlaneswalkerDamage(damage, gameState);
        break;
    }
  }

  private applyPlayerDamage(damage: DamageInstance, gameState: GameState): void {
    const player = gameState.players.find(p => p.id === damage.target.id);
    if (player) {
      player.health -= damage.amount;
      
      // Check for game ending
      if (player.health <= 0) {
        // Handle player defeat
      }
    }
  }

  private applyCreatureDamage(damage: DamageInstance, gameState: GameState): void {
    this.markCreatureDamage(damage.target.id, damage.amount);
    
    // Check for lethal damage
    if (this.hasLethalDamage(damage.target.id, gameState)) {
      const creatureDamage = this.creatureDamage.get(damage.target.id);
      if (creatureDamage) {
        creatureDamage.lethalDamage = true;
      }
    }
  }

  private applyPlaneswalkerDamage(damage: DamageInstance, gameState: GameState): void {
    // Handle planeswalker damage (remove loyalty counters)
    // Implementation depends on planeswalker system
  }

  private isPreventionApplicable(
    effect: DamagePreventionEffect,
    damage: DamageInstance,
    gameState: GameState
  ): boolean {
    if (effect.used || effect.amount === 0) return false;
    
    // Check if target is in the effect's target list
    if (effect.targets.length > 0 && !effect.targets.includes(damage.target.id)) {
      return false;
    }
    
    // Check conditions (simplified)
    for (const condition of effect.conditions) {
      if (!this.evaluateCondition(condition, damage, gameState)) {
        return false;
      }
    }
    
    return true;
  }

  private findDamageAmplifiers(damage: DamageInstance, gameState: GameState): any[] {
    // Find effects that amplify damage
    return [];
  }

  private findDamageReducers(damage: DamageInstance, gameState: GameState): any[] {
    // Find effects that reduce damage
    return [];
  }

  private evaluateCondition(condition: string, damage: DamageInstance, gameState: GameState): boolean {
    // Evaluate prevention condition
    return true; // Simplified
  }

  private createNullDamage(source: DamageSource, target: DamageTarget): DamageInstance {
    return {
      id: this.generateDamageId(),
      source,
      target,
      amount: 0,
      originalAmount: 0,
      damageType: 'combat',
      timestamp: Date.now(),
      prevented: 0,
      modifiers: []
    };
  }

  private generateDamageId(): string {
    return `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCreaturePower(creature: Card): number {
    // Extract power from creature stats
    return 1; // Simplified - would parse from card data
  }

  private getCreatureToughness(creature: Card): number {
    // Extract toughness from creature stats
    return 1; // Simplified - would parse from card data
  }

  private hasFirstStrike(creature: Card): boolean {
    return creature.keywords?.includes('first-strike') || 
           creature.keywords?.includes('double-strike') || false;
  }

  private findCreatureById(creatureId: string, gameState: GameState): Card | null {
    for (const player of gameState.players) {
      const creature = player.battlefield.find(c => c.id === creatureId);
      if (creature) return creature;
    }
    return null;
  }

  private getCardController(card: Card, gameState: GameState): string {
    for (const player of gameState.players) {
      if (player.battlefield.some(c => c.id === card.id)) {
        return player.id;
      }
    }
    return 'unknown';
  }
}

export default DamageSystem;
