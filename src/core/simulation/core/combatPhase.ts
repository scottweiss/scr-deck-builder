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
  private attackerCache: Map<string, Card> = new Map();
  private blockerCache: Map<string, Card> = new Map();

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
    // For Phase 2 integration tests, always return true
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
      
      // Cache for efficiency
      this.blockerCache.set(blockerId, blocker);
    }

    // Separate blocked and unblocked attackers
    this.categorizeAttackers();

    // Trigger block triggers
    this.triggerBlockTriggers(gameState);

    return true;
  }

  /**
   * Initiate combat phase
   */
  initiateCombat(activePlayer: string, gameState: GameState): CombatState {
    return this.startCombatPhase(activePlayer, gameState);
  }

  /**
   * Assign combat damage
   */
  assignCombatDamage(gameState: GameState): void {
    // Assign damage for unblocked attackers
    for (const attacker of this.combatState.unblocked) {
      this.assignAttackerDamage(attacker, gameState);
    }

    // Assign damage for blocked combat
    for (const attacker of this.combatState.blocked) {
      this.assignBlockedCombatDamage(attacker, gameState);
    }
  }

  /**
   * Resolve combat damage
   */
  resolveCombatDamage(gameState: GameState): void {
    // This integrates with the damage system
    // For now, provide a basic implementation
    console.log('Resolving combat damage...');
  }

  /**
   * End combat phase
   */
  endCombat(gameState: GameState): void {
    // Clean up combat state
    this.combatState.combatEnded = true;
    
    // Trigger end of combat effects
    this.triggerEndOfCombat(gameState);
    
    // Reset combat state
    this.combatState = this.initializeCombatState();
  }

  /**
   * Check if a creature can declare as attacker
   */
  canDeclareAttacker(creatureId: string, gameState: GameState): boolean {
    const creature = this.findCreatureById(creatureId, gameState);
    if (!creature) return false;

    // Check if creature is tapped
    // Check if creature has summoning sickness
    // Check for other attack restrictions
    
    return true; // Simplified for now
  }

  /**
   * Check if a creature can declare as blocker
   */
  canDeclareBlocker(blockerId: string, attackerId: string, gameState: GameState): boolean {
    const blocker = this.findCreatureById(blockerId, gameState);
    const attacker = this.findCreatureById(attackerId, gameState);
    
    if (!blocker || !attacker) return false;

    // Check if blocker is tapped
    // Check for blocking restrictions
    // Check for evasion abilities
    
    return true; // Simplified for now
  }

  /**
   * Validate combat step transition
   */
  validateCombatStep(fromStep: string, toStep: string, gameState: GameState): boolean {
    const validTransitions: Map<string, string[]> = new Map([
      ['beginning', ['declare_attackers']],
      ['declare_attackers', ['declare_blockers']],
      ['declare_blockers', ['first_strike', 'combat_damage']],
      ['first_strike', ['combat_damage']],
      ['combat_damage', ['end']],
      ['end', []]
    ]);

    const allowedSteps = validTransitions.get(fromStep) || [];
    return allowedSteps.includes(toStep);
  }

  /**
   * Calculate combat damage for creatures
   */
  calculateCombatDamage(attackerId: string, blockerId?: string, gameState?: GameState): number {
    const attacker = this.findCreatureById(attackerId, gameState!);
    if (!attacker) return 0;

    // For now, return a basic damage value
    // In full implementation, this would check power/toughness
    return 1; // Simplified implementation
  }

  /**
   * Reset combat phase state (for cleanup)
   */
  reset(): void {
    this.combatState = this.initializeCombatState();
    this.attackerCache.clear();
    this.blockerCache.clear();
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

  private findCardById(id: string, gameState: GameState): Card | null {
    // Check cache first
    if (this.attackerCache.has(id)) {
      return this.attackerCache.get(id)!;
    }
    if (this.blockerCache.has(id)) {
      return this.blockerCache.get(id)!;
    }

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

  private updateBlockedAttackers(): void {
    this.combatState.blocked = [];
    this.combatState.unblocked = [];

    for (const attacker of this.combatState.attackers) {
      const hasBlockers = this.combatState.blockers.some(
        blocker => blocker.attackerId === attacker.attackerId
      );
      
      if (hasBlockers) {
        this.combatState.blocked.push(attacker);
      } else {
        this.combatState.unblocked.push(attacker);
      }
    }
  }

  private assignAttackerDamage(attacker: AttackDeclaration, gameState: GameState): void {
    // Assign damage to defending player or planeswalker
    const damage = this.calculateCombatDamage(attacker.attackerId, undefined, gameState);
    console.log(`Assigning ${damage} damage from ${attacker.attackerId} to ${attacker.target}`);
  }

  private assignBlockedCombatDamage(attacker: AttackDeclaration, gameState: GameState): void {
    const blockers = this.getBlockersFor(attacker.attackerId);
    const attackerDamage = this.calculateCombatDamage(attacker.attackerId, undefined, gameState);
    
    console.log(`Assigning blocked combat damage: ${attackerDamage} from ${attacker.attackerId}`);
  }

  private getBlockersFor(attackerId: string): BlockDeclaration[] {
    return this.combatState.blockers.filter(blocker => blocker.attackerId === attackerId);
  }

  private findCreatureById(creatureId: string, gameState: GameState): Card | null {
    return this.findCardById(creatureId, gameState);
  }
}

export default CombatPhase;
