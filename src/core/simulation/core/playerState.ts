/**
 * Enhanced player state management for Sorcery: Contested Realm
 * Part of Phase 1: Core Engine Foundation
 */

import { Card } from '../../../types/Card';
import { Unit, Position } from './gameState';

export interface PlayerStatistics {
  cardsDrawn: number;
  spellsCast: number;
  unitsPlayed: number;
  sitesPlayed: number;
  combatDamageDealt: number;
  combatDamageReceived: number;
  averageManaUsed: number;
  turnsPlayed: number;
}

export interface PlayerResources {
  mana: number;
  maxMana: number;
  temporaryMana: number;
  // Elemental affinity tracking
  elementalAffinity: {
    air: number;
    earth: number;
    fire: number;
    water: number;
  };
  // Site-based bonuses
  siteBonuses: {
    manaGeneration: number;
    cardDraw: number;
    spellPowerBonus: number;
  };
}

export interface PlayerHand {
  spells: Card[];
  sites: Card[];
  maxHandSize: number;
}

export interface PlayerDeck {
  spellbook: Card[];
  atlas: Card[];
  originalSpellbook: Card[];
  originalAtlas: Card[];
}

export interface PlayerBattlefield {
  avatar: Unit;
  controlledUnits: string[];
  controlledSites: string[];
  controlledArtifacts: string[];
}

export interface PlayerState {
  id: 'player1' | 'player2';
  name: string;
  
  // Core game stats
  life: number;
  maxLife: number;
  atDeathsDoor: boolean;
  
  // Resources
  resources: PlayerResources;
  
  // Cards
  hand: PlayerHand;
  deck: PlayerDeck;
  cemetery: Card[];
  exiled: Card[];
  
  // Battlefield presence
  battlefield: PlayerBattlefield;
  
  // Game state tracking
  hasPriority: boolean;
  hasPlayedSiteThisTurn: boolean;
  actionsThisTurn: string[];
  
  // Statistics
  statistics: PlayerStatistics;
  
  // Effects and modifiers
  continuousEffects: ContinuousEffect[];
  turnModifiers: TurnModifier[];
}

export interface ContinuousEffect {
  id: string;
  source: string;
  type: 'mana_bonus' | 'card_draw' | 'spell_cost_reduction' | 'damage_bonus';
  value: number;
  duration: 'permanent' | 'turn' | 'phase' | 'combat';
  conditions?: EffectCondition[];
}

export interface TurnModifier {
  id: string;
  type: 'extra_action' | 'skip_phase' | 'double_mana' | 'no_hand_limit';
  expiresAtEndOfTurn: boolean;
}

export interface EffectCondition {
  property: 'life' | 'hand_size' | 'units_in_play' | 'sites_controlled';
  operator: 'less_than' | 'greater_than' | 'equal_to';
  value: number;
}

export class PlayerStateManager {
  private players: Map<string, PlayerState> = new Map();

  constructor() {}

  /**
   * Initialize a new player state
   */
  public initializePlayer(
    playerId: 'player1' | 'player2',
    avatar: Card,
    spellbook: Card[],
    atlas: Card[],
    playerName?: string
  ): PlayerState {
    const playerState: PlayerState = {
      id: playerId,
      name: playerName || `Player ${playerId === 'player1' ? '1' : '2'}`,
      
      life: avatar.life || 25,
      maxLife: avatar.life || 25,
      atDeathsDoor: false,
      
      resources: {
        mana: 0,
        maxMana: 0,
        temporaryMana: 0,
        elementalAffinity: { air: 0, earth: 0, fire: 0, water: 0 },
        siteBonuses: {
          manaGeneration: 0,
          cardDraw: 0,
          spellPowerBonus: 0
        }
      },
      
      hand: {
        spells: [],
        sites: [],
        maxHandSize: 7
      },
      
      deck: {
        spellbook: [...spellbook],
        atlas: [...atlas],
        originalSpellbook: [...spellbook],
        originalAtlas: [...atlas]
      },
      
      cemetery: [],
      exiled: [],
      
      battlefield: {
        avatar: {} as Unit, // Will be set when avatar is placed
        controlledUnits: [],
        controlledSites: [],
        controlledArtifacts: []
      },
      
      hasPriority: false,
      hasPlayedSiteThisTurn: false,
      actionsThisTurn: [],
      
      statistics: {
        cardsDrawn: 0,
        spellsCast: 0,
        unitsPlayed: 0,
        sitesPlayed: 0,
        combatDamageDealt: 0,
        combatDamageReceived: 0,
        averageManaUsed: 0,
        turnsPlayed: 0
      },
      
      continuousEffects: [],
      turnModifiers: []
    };

    this.players.set(playerId, playerState);
    return playerState;
  }

  /**
   * Get player state by ID
   */
  public getPlayer(playerId: string): PlayerState | undefined {
    return this.players.get(playerId);
  }

  /**
   * Draw initial hand (3 spells, 3 sites)
   */
  public drawStartingHand(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    // Shuffle decks
    this.shuffleDeck(player, 'spellbook');
    this.shuffleDeck(player, 'atlas');

    // Draw starting cards
    for (let i = 0; i < 3; i++) {
      this.drawCard(playerId, 'spellbook');
      this.drawCard(playerId, 'atlas');
    }

    return true;
  }

  /**
   * Draw a card from specified deck
   */
  public drawCard(playerId: string, deckType: 'spellbook' | 'atlas'): Card | null {
    const player = this.getPlayer(playerId);
    if (!player) return null;

    const deck = player.deck[deckType];
    if (deck.length === 0) return null;

    const card = deck.shift()!;
    
    if (deckType === 'spellbook') {
      player.hand.spells.push(card);
    } else {
      player.hand.sites.push(card);
    }

    player.statistics.cardsDrawn++;
    return card;
  }

  /**
   * Shuffle a deck
   */
  public shuffleDeck(player: PlayerState, deckType: 'spellbook' | 'atlas'): void {
    const deck = player.deck[deckType];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  /**
   * Add mana to player's resource pool
   */
  public addMana(playerId: string, amount: number, temporary: boolean = false): boolean {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    if (temporary) {
      player.resources.temporaryMana += amount;
    } else {
      player.resources.mana += amount;
    }

    return true;
  }

  /**
   * Spend mana from player's resource pool
   */
  public spendMana(playerId: string, amount: number): boolean {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    const totalMana = player.resources.mana + player.resources.temporaryMana;
    if (totalMana < amount) return false;

    // Spend temporary mana first
    const temporarySpent = Math.min(amount, player.resources.temporaryMana);
    player.resources.temporaryMana -= temporarySpent;
    
    const remainingToSpend = amount - temporarySpent;
    player.resources.mana -= remainingToSpend;

    return true;
  }

  /**
   * Get total available mana
   */
  public getAvailableMana(playerId: string): number {
    const player = this.getPlayer(playerId);
    if (!player) return 0;

    return player.resources.mana + player.resources.temporaryMana;
  }

  /**
   * Update elemental affinity based on controlled sites
   */
  public updateElementalAffinity(playerId: string, sites: Card[]): void {
    const player = this.getPlayer(playerId);
    if (!player) return;

    const affinity = { air: 0, earth: 0, fire: 0, water: 0 };
    
    sites.forEach(site => {
      if (site.elements) {
        site.elements.forEach(element => {
          const elementKey = element.toLowerCase() as keyof typeof affinity;
          if (elementKey in affinity) {
            affinity[elementKey]++;
          }
        });
      }
    });

    player.resources.elementalAffinity = affinity;
  }

  /**
   * Add a continuous effect to player
   */
  public addContinuousEffect(playerId: string, effect: ContinuousEffect): boolean {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    player.continuousEffects.push(effect);
    return true;
  }

  /**
   * Remove a continuous effect
   */
  public removeContinuousEffect(playerId: string, effectId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    const index = player.continuousEffects.findIndex(effect => effect.id === effectId);
    if (index >= 0) {
      player.continuousEffects.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Clean up effects at end of turn
   */
  public endTurnCleanup(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (!player) return;

    // Remove turn-based effects
    player.continuousEffects = player.continuousEffects.filter(
      effect => effect.duration !== 'turn' && effect.duration !== 'phase'
    );

    // Remove turn modifiers
    player.turnModifiers = player.turnModifiers.filter(
      modifier => !modifier.expiresAtEndOfTurn
    );

    // Clear temporary mana
    player.resources.temporaryMana = 0;

    // Reset turn-specific flags
    player.hasPlayedSiteThisTurn = false;
    player.actionsThisTurn = [];

    // Update statistics
    player.statistics.turnsPlayed++;
  }

  /**
   * Check if player meets elemental requirements for a spell
   */
  public canPayElementalCost(playerId: string, card: Card): boolean {
    const player = this.getPlayer(playerId);
    if (!player || !card.elements) return true;

    for (const element of card.elements) {
      const elementKey = element.toLowerCase() as keyof typeof player.resources.elementalAffinity;
      const required = 1; // Most cards require 1 threshold
      const available = player.resources.elementalAffinity[elementKey] || 0;
      
      if (available < required) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all player states
   */
  public getAllPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }

  /**
   * Reset all player states (for new game)
   */
  public reset(): void {
    this.players.clear();
  }
}
