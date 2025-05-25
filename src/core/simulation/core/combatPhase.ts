/**
 * Combat Phase System for Sorcery TCG
 * Handles the complete combat phase with all timing and priority windows
 */

import { Player, GameState, BoardPosition } from '../../../types/game-types';
import { Card } from '../../../types/card-types';
import { ActionStack } from './actionStack';
import { PrioritySystem } from './prioritySystem';
import { BoardStateManager } from './boardState';

export interface AttackDeclaration {
  attacker: Card;
  attackerId: string;
  target: 'player' | 'planeswalker';
  targetId: string;
  declared: boolean;
}

export interface BlockDeclaration {
  blocker: Card;
  blockerId: string;
  attackerId: string;
  blockerOrder?: number;
}

export interface CombatStep {
  name: 'beginning' | 'declare_attackers' | 'declare_blockers' | 'first_strike' | 'combat_damage' | 'end';
  priority: boolean;
  activePlayer: string;
}

export interface CombatState {
  step: CombatStep;
  attackers: AttackDeclaration[];
  blockers: BlockDeclaration[];
  unblocked: AttackDeclaration[];
  blocked: AttackDeclaration[];
  firstStrikeHappened: boolean;
  combatEnded: boolean;
}

export class CombatPhase {
  private actionStack: ActionStack;
  private prioritySystem: PrioritySystem;
  private boardState: BoardStateManager;
  private combatState: CombatState;

  constructor(
    actionStack: ActionStack,
    prioritySystem: PrioritySystem,
    boardState: BoardStateManager
  ) {
    this.actionStack = actionStack;
    this.prioritySystem = prioritySystem;
    this.boardState = boardState;
    this.combatState = this.initializeCombatState();
  }

  /**
   * Start the combat phase
   */
  startCombatPhase(activePlayer: string, gameState: GameState): CombatState {
    this.combatState = this.initializeCombatState();
    this.combatState.step = {
      name: 'beginning',
      priority: true,
      activePlayer
    };

    // Trigger beginning of combat abilities
    this.triggerBeginningOfCombat(gameState);

    return this.combatState;
  }

  /**
   * Advance to the next combat step
   */
  advanceCombatStep(gameState: GameState): CombatStep {
    switch (this.combatState.step.name) {
      case 'beginning':
        this.combatState.step.name = 'declare_attackers';
        break;
        
      case 'declare_attackers':
        this.combatState.step.name = 'declare_blockers';
        break;
        
      case 'declare_blockers':
        // Check if any creatures have first strike
        if (this.hasFirstStrikeCreatures() && !this.combatState.firstStrikeHappened) {
          this.combatState.step.name = 'first_strike';
          this.combatState.firstStrikeHappened = true;
        } else {
          this.combatState.step.name = 'combat_damage';
        }
        break;
        
      case 'first_strike':
        this.combatState.step.name = 'combat_damage';
        break;
        
      case 'combat_damage':
        this.combatState.step.name = 'end';
        break;
        
      case 'end':
        this.combatState.combatEnded = true;
        this.triggerEndOfCombat(gameState);
        break;
    }

    return this.combatState.step;
  }

  /**
   * Declare attackers for the active player
   */
  declareAttackers(
    attackerIds: string[],
    targets: { [attackerId: string]: string },
    gameState: GameState
  ): boolean {
    if (this.combatState.step.name !== 'declare_attackers') {
      return false;
    }

    // Clear previous declarations
    this.combatState.attackers = [];

    for (const attackerId of attackerIds) {
      const attacker = this.findCardById(attackerId, gameState);
      const targetId = targets[attackerId];

      if (!attacker || !this.canAttack(attacker, gameState)) {
        continue;
      }

      // Determine target type
      const targetType = this.isPlayerTarget(targetId, gameState) ? 'player' : 'planeswalker';

      const declaration: AttackDeclaration = {
        attacker,
        attackerId,
        target: targetType,
        targetId,
        declared: true
      };

      this.combatState.attackers.push(declaration);
      
      // Tap the attacker (unless it has vigilance)
      if (!attacker.keywords?.includes('vigilance')) {
        this.tapCreature(attacker, gameState);
      }
    }

    // Trigger attack triggers
    this.triggerAttackTriggers(gameState);

    return true;
  }

  /**
   * Declare blockers for the defending player
   */
  declareBlockers(
    blockAssignments: { [blockerId: string]: string },
    gameState: GameState
  ): boolean {
    if (this.combatState.step.name !== 'declare_blockers') {
      return false;
    }

    // Clear previous declarations
    this.combatState.blockers = [];

    for (const [blockerId, attackerId] of Object.entries(blockAssignments)) {
      const blocker = this.findCardById(blockerId, gameState);
      const attacker = this.findCardById(attackerId, gameState);

      if (!blocker || !attacker || !this.canBlock(blocker, attacker, gameState)) {
        continue;
      }

      const declaration: BlockDeclaration = {
        blocker,
        blockerId,
        attackerId
      };

      this.combatState.blockers.push(declaration);
    }

    // Separate blocked and unblocked attackers
    this.categorizeAttackers();

    // Trigger block triggers
    this.triggerBlockTriggers(gameState);

    return true;
  }

  /**
   * Resolve combat damage
   */
  resolveCombatDamage(gameState: GameState, firstStrike: boolean = false): void {
    const relevantAttackers = firstStrike 
      ? this.combatState.attackers.filter(a => this.hasFirstStrike(a.attacker))
      : this.combatState.attackers.filter(a => !firstStrike || !this.hasFirstStrike(a.attacker));

    // Resolve damage for unblocked attackers
    for (const attack of this.combatState.unblocked) {
      if (relevantAttackers.includes(attack)) {
        this.dealUnblockedDamage(attack, gameState);
      }
    }

    // Resolve damage for blocked attackers
    for (const attack of this.combatState.blocked) {
      if (relevantAttackers.includes(attack)) {
        this.dealBlockedDamage(attack, gameState);
      }
    }

    // Check for creature destruction
    this.checkCreatureDestruction(gameState);
  }

  /**
   * Get current combat state
   */
  getCombatState(): CombatState {
    return { ...this.combatState };
  }

  /**
   * Check if combat phase is complete
   */
  isCombatComplete(): boolean {
    return this.combatState.combatEnded;
  }

  /**
   * Get attackers targeting a specific player/planeswalker
   */
  getAttackersTargeting(targetId: string): AttackDeclaration[] {
    return this.combatState.attackers.filter(a => a.targetId === targetId);
  }

  /**
   * Get blockers assigned to a specific attacker
   */
  getBlockersFor(attackerId: string): BlockDeclaration[] {
    return this.combatState.blockers.filter(b => b.attackerId === attackerId);
  }

  /**
   * Initiate combat phase (alias for startCombatPhase)
   */
  initiateCombat(activePlayer: string, gameState: GameState): CombatState {
    return this.startCombatPhase(activePlayer, gameState);
  }

  /**
   * Check if a creature can be declared as an attacker
   */
  canDeclareAttacker(creatureId: string, gameState: GameState): boolean {
    const creature = this.findCardById(creatureId, gameState);
    if (!creature) return false;
    
    return this.canAttack(creature, gameState) && 
           this.combatState.step.name === 'declare_attackers';
  }

  /**
   * Check if a creature can be declared as a blocker
   */
  canDeclareBlocker(creatureId: string, attackerId: string, gameState: GameState): boolean {
    const blocker = this.findCardById(creatureId, gameState);
    const attacker = this.findCardById(attackerId, gameState);
    
    if (!blocker || !attacker) return false;
    
    return this.canBlock(blocker, attacker, gameState) && 
           this.combatState.step.name === 'declare_blockers';
  }

  /**
   * Validate if a combat step transition is legal
   */
  validateCombatStep(targetStep: string): boolean {
    const currentStep = this.combatState.step.name;
    
    const validTransitions: { [key: string]: string[] } = {
      'beginning': ['declare_attackers'],
      'declare_attackers': ['declare_blockers'],
      'declare_blockers': ['first_strike', 'combat_damage'],
      'first_strike': ['combat_damage'],
      'combat_damage': ['end'],
      'end': []
    };

    return validTransitions[currentStep]?.includes(targetStep) || false;
  }

  // Private helper methods

  private initializeCombatState(): CombatState {
    return {
      step: {
        name: 'beginning',
        priority: false,
        activePlayer: ''
      },
      attackers: [],
      blockers: [],
      unblocked: [],
      blocked: [],
      firstStrikeHappened: false,
      combatEnded: false
    };
  }

  private triggerBeginningOfCombat(gameState: GameState): void {
    // Look for "beginning of combat" triggered abilities
    // This would integrate with the effect parser to find and trigger abilities
  }

  private triggerEndOfCombat(gameState: GameState): void {
    // Look for "end of combat" triggered abilities
    // Clean up combat-specific effects
  }

  private triggerAttackTriggers(gameState: GameState): void {
    // Trigger "whenever [this creature] attacks" abilities
    for (const attack of this.combatState.attackers) {
      if (attack.attacker.effect?.toLowerCase().includes('whenever') && 
          attack.attacker.effect?.toLowerCase().includes('attacks')) {
        // Would trigger the ability through effect parser
      }
    }
  }

  private triggerBlockTriggers(gameState: GameState): void {
    // Trigger "whenever [this creature] blocks" abilities
    for (const block of this.combatState.blockers) {
      if (block.blocker.effect?.toLowerCase().includes('whenever') && 
          block.blocker.effect?.toLowerCase().includes('blocks')) {
        // Would trigger the ability through effect parser
      }
    }
  }

  private hasFirstStrikeCreatures(): boolean {
    return this.combatState.attackers.some(a => this.hasFirstStrike(a.attacker)) ||
           this.combatState.blockers.some(b => this.hasFirstStrike(b.blocker));
  }

  private hasFirstStrike(creature: Card): boolean {
    return creature.keywords?.includes('first-strike') || 
           creature.keywords?.includes('double-strike') || false;
  }

  private canAttack(creature: Card, gameState: GameState): boolean {
    // Check if creature can attack (not tapped, no summoning sickness, etc.)
    return creature.type === 'Creature' || creature.type === 'Avatar';
  }

  private canBlock(blocker: Card, attacker: Card, gameState: GameState): boolean {
    // Check if blocker can block the attacker
    if (blocker.type !== 'Creature' && blocker.type !== 'Avatar') {
      return false;
    }

    // Check for flying/reach interactions
    if (attacker.keywords?.includes('flying') && 
        !blocker.keywords?.includes('flying') && 
        !blocker.keywords?.includes('reach')) {
      return false;
    }

    return true;
  }

  private categorizeAttackers(): void {
    this.combatState.unblocked = [];
    this.combatState.blocked = [];

    for (const attack of this.combatState.attackers) {
      const hasBlockers = this.combatState.blockers.some(b => b.attackerId === attack.attackerId);
      
      if (hasBlockers) {
        this.combatState.blocked.push(attack);
      } else {
        this.combatState.unblocked.push(attack);
      }
    }
  }

  private dealUnblockedDamage(attack: AttackDeclaration, gameState: GameState): void {
    // Deal damage equal to attacker's power to the target
    const power = this.getCreaturePower(attack.attacker);
    
    if (attack.target === 'player') {
      this.dealDamageToPlayer(attack.targetId, power, gameState);
    }
    // Handle planeswalker damage if applicable
  }

  private dealBlockedDamage(attack: AttackDeclaration, gameState: GameState): void {
    const blockers = this.getBlockersFor(attack.attackerId);
    const attackerPower = this.getCreaturePower(attack.attacker);
    const attackerToughness = this.getCreatureToughness(attack.attacker);

    // Assign damage to blockers (simplified - would need damage assignment UI)
    let remainingDamage = attackerPower;
    
    for (const block of blockers) {
      const blockerToughness = this.getCreatureToughness(block.blocker);
      const damageToBlocker = Math.min(remainingDamage, blockerToughness);
      
      // Deal damage to blocker
      this.dealDamageToCreature(block.blocker, damageToBlocker);
      
      // Deal damage back to attacker
      const blockerPower = this.getCreaturePower(block.blocker);
      this.dealDamageToCreature(attack.attacker, blockerPower);
      
      remainingDamage -= damageToBlocker;
      
      if (remainingDamage <= 0) break;
    }
  }

  private checkCreatureDestruction(gameState: GameState): void {
    // Check all creatures in combat for lethal damage
    // Remove destroyed creatures and trigger death triggers
  }

  private findCardById(id: string, gameState: GameState): Card | null {
    // Find a card by ID in the game state
    for (const player of gameState.players) {
      const card = player.battlefield.find(c => c.id === id);
      if (card) return card;
    }
    return null;
  }

  private isPlayerTarget(targetId: string, gameState: GameState): boolean {
    return gameState.players.some(p => p.id === targetId);
  }

  private tapCreature(creature: Card, gameState: GameState): void {
    // Mark creature as tapped
    // This would integrate with game state management
  }

  private getCreaturePower(creature: Card): number {
    // Extract power from creature (would be in card data)
    return 1; // Simplified
  }

  private getCreatureToughness(creature: Card): number {
    // Extract toughness from creature (would be in card data)
    return 1; // Simplified
  }

  private dealDamageToPlayer(playerId: string, damage: number, gameState: GameState): void {
    // Deal damage to player through damage system
  }

  private dealDamageToCreature(creature: Card, damage: number): void {
    // Mark damage on creature
  }
}

export default CombatPhase;
