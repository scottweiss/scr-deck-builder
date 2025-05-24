/**
 * Core game state management for Sorcery: Contested Realm match simulation
 */

import { Card, Element } from '../../../types/Card';

// Re-export Card type for use in other simulation modules
export { Card } from '../../../types/Card';

export interface Position {
  x: number; // 0-4 (5 columns)
  y: number; // 0-3 (4 rows)
}

export interface GridSquare {
  position: Position;
  site?: Card;
  units: Unit[];
  region: 'void' | 'surface' | 'underground' | 'underwater';
  isRubble: boolean;
}

export interface Unit {
  id: string;
  card: Card;
  owner: 'player1' | 'player2';
  position: Position;
  region: 'surface' | 'underground' | 'underwater' | 'void';
  isTapped: boolean;
  damage: number;
  summoning_sickness: boolean;
  artifacts: Artifact[];
  modifiers: UnitModifier[];
  // Additional properties needed by combat and AI systems
  name?: string;
  power?: number;
  life?: number;
  canAct?: boolean;
  abilities?: string[];
  elements?: string[];
  cost?: number;
}

export interface Artifact {
  id: string;
  card: Card;
  owner: 'player1' | 'player2';
  carrier?: string; // Unit ID
  position?: Position; // If not carried
}

export interface UnitModifier {
  type: 'power' | 'life' | 'ability' | 'keyword' | 'damage_reduction';
  value: number | string;
  source: string;
  duration: 'permanent' | 'turn' | 'until_end_of_turn';
}

export interface Player {
  id: 'player1' | 'player2';
  avatar: Unit;
  life: number;
  maxLife: number;
  atDeathsDoor: boolean;
  mana: number;
  hand: {
    spells: Card[];
    sites: Card[];
  };
  decks: {
    spellbook: Card[];
    atlas: Card[];
  };
  // Also support legacy deck property for compatibility
  deck?: Card[];
  cemetery: Card[];
  // Also support graveyard property for compatibility
  graveyard?: Card[];
  controlledSites: string[]; // Site IDs
  elementalAffinity: {
    air: number;
    earth: number;
    fire: number;
    water: number;
  };
}

export interface GamePhase {
  type: 'start' | 'main' | 'end';
  step?: number;
  activePlayer: 'player1' | 'player2';
}

export interface GameState {
  turn: number;
  phase: GamePhase;
  grid: GridSquare[][];
  players: {
    player1: Player;
    player2: Player;
  };
  units: Map<string, Unit>;
  artifacts: Map<string, Artifact>;
  sites: Map<string, Card>;
  storyline: GameEvent[];
  winner?: 'player1' | 'player2' | 'draw';
  gameOver: boolean;
  firstPlayer: 'player1' | 'player2';
  // Legacy compatibility property
  currentPlayerId?: 'player1' | 'player2';
}

export interface GameEvent {
  id: string;
  type: 'spell_cast' | 'unit_move' | 'unit_attack' | 'ability_activate' | 'combat_damage' | 'site_play' | 
        'unit_intercept' | 'unit_destroyed' | 'ability_triggered' | 'spell_damage' | 'player_damage' | 
        'unit_healed' | 'player_healed' | 'card_drawn' | 'unit_summoned' | 'unit_modified' | 'unit_moved';
  activePlayer: 'player1' | 'player2';
  description: string;
  sourceUnit?: string;
  targetUnit?: string;
  targetPosition?: Position;
  damage?: number;
  resolved: boolean;
  timestamp?: number;
  // Additional data field for complex events
  data?: any;
}

export class GameStateManager {
  private state: GameState;

  constructor(player1Deck?: { avatar: Card; spells: Card[]; sites: Card[] }, 
              player2Deck?: { avatar: Card; spells: Card[]; sites: Card[] }) {
    if (player1Deck && player2Deck) {
      this.state = this.initializeGame(player1Deck, player2Deck);
    } else {
      // Initialize with empty state for testing
      this.state = {} as GameState;
    }
  }

  public initializeGame(
    player1Deck: { avatar: Card; spells: Card[]; sites: Card[] },
    player2Deck: { avatar: Card; spells: Card[]; sites: Card[] }
  ): GameState {
    // Initialize 5x4 grid
    const grid: GridSquare[][] = [];
    for (let y = 0; y < 4; y++) {
      grid[y] = [];
      for (let x = 0; x < 5; x++) {
        grid[y][x] = {
          position: { x, y },
          units: [],
          region: 'void',
          isRubble: false
        };
      }
    }

    // Randomly determine first player
    const firstPlayer: 'player1' | 'player2' = Math.random() < 0.5 ? 'player1' : 'player2';

    // Create avatars at starting positions
    const player1Avatar: Unit = {
      id: 'avatar_player1',
      card: player1Deck.avatar,
      owner: 'player1',
      position: { x: 2, y: 0 }, // Center of bottom row for player 1
      region: 'surface',
      isTapped: false,
      damage: 0,
      summoning_sickness: false,
      artifacts: [],
      modifiers: []
    };

    const player2Avatar: Unit = {
      id: 'avatar_player2',
      card: player2Deck.avatar,
      owner: 'player2',
      position: { x: 2, y: 3 }, // Center of top row for player 2
      region: 'surface',
      isTapped: false,
      damage: 0,
      summoning_sickness: false,
      artifacts: [],
      modifiers: []
    };

    // Shuffle decks
    const shuffledP1Spells = [...player1Deck.spells].sort(() => Math.random() - 0.5);
    const shuffledP1Sites = [...player1Deck.sites].sort(() => Math.random() - 0.5);
    const shuffledP2Spells = [...player2Deck.spells].sort(() => Math.random() - 0.5);
    const shuffledP2Sites = [...player2Deck.sites].sort(() => Math.random() - 0.5);

    // Draw starting hands (3 spells, 3 sites each)
    const player1: Player = {
      id: 'player1',
      avatar: player1Avatar,
      life: player1Deck.avatar.life || 20,
      maxLife: player1Deck.avatar.life || 20,
      atDeathsDoor: false,
      mana: 0,
      hand: {
        spells: shuffledP1Spells.slice(0, 3),
        sites: shuffledP1Sites.slice(0, 3)
      },
      decks: {
        spellbook: shuffledP1Spells.slice(3),
        atlas: shuffledP1Sites.slice(3)
      },
      cemetery: [],
      controlledSites: [],
      elementalAffinity: { air: 0, earth: 0, fire: 0, water: 0 }
    };

    const player2: Player = {
      id: 'player2',
      avatar: player2Avatar,
      life: player2Deck.avatar.life || 20,
      maxLife: player2Deck.avatar.life || 20,
      atDeathsDoor: false,
      mana: 0,
      hand: {
        spells: shuffledP2Spells.slice(0, 3),
        sites: shuffledP2Sites.slice(0, 3)
      },
      decks: {
        spellbook: shuffledP2Spells.slice(3),
        atlas: shuffledP2Sites.slice(3)
      },
      cemetery: [],
      controlledSites: [],
      elementalAffinity: { air: 0, earth: 0, fire: 0, water: 0 }
    };

    // Place avatars on grid
    grid[0][2].units.push(player1Avatar);
    grid[3][2].units.push(player2Avatar);

    return {
      turn: 1,
      phase: {
        type: 'start',
        step: 1,
        activePlayer: firstPlayer
      },
      grid,
      players: { player1, player2 },
      units: new Map([
        ['avatar_player1', player1Avatar],
        ['avatar_player2', player2Avatar]
      ]),
      artifacts: new Map(),
      sites: new Map(),
      storyline: [],
      gameOver: false,
      firstPlayer
    };
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getCurrentPlayer(): Player {
    return this.state.players[this.state.phase.activePlayer];
  }

  public getOpponentPlayer(): Player {
    const opponentId = this.state.phase.activePlayer === 'player1' ? 'player2' : 'player1';
    return this.state.players[opponentId];
  }

  public getUnitsAt(position: Position, region?: string): Unit[] {
    const square = this.state.grid[position.y][position.x];
    if (!region) {
      return square.units;
    }
    return square.units.filter(unit => unit.region === region);
  }

  public getSiteAt(position: Position): Card | undefined {
    return this.state.grid[position.y][position.x].site;
  }

  public moveUnit(unitId: string, fromPos: Position, toPos: Position, newRegion?: string): boolean {
    const unit = this.state.units.get(unitId);
    if (!unit) return false;

    // Remove from old position
    const fromSquare = this.state.grid[fromPos.y][fromPos.x];
    fromSquare.units = fromSquare.units.filter(u => u.id !== unitId);

    // Add to new position
    const toSquare = this.state.grid[toPos.y][toPos.x];
    unit.position = toPos;
    if (newRegion) {
      unit.region = newRegion as any;
    }
    toSquare.units.push(unit);

    return true;
  }

  public playSite(site: Card, position: Position, owner: 'player1' | 'player2'): boolean {
    const square = this.state.grid[position.y][position.x];
    
    // Can only place on void or rubble
    if (square.site && !square.isRubble) {
      return false;
    }

    square.site = site;
    square.region = 'surface';
    square.isRubble = false;

    const siteId = `site_${position.x}_${position.y}`;
    this.state.sites.set(siteId, site);
    this.state.players[owner].controlledSites.push(siteId);

    // Update elemental affinity
    this.updateElementalAffinity(owner);

    return true;
  }

  public dealDamage(unitId: string, damage: number, source?: string): boolean {
    const unit = this.state.units.get(unitId);
    if (!unit) return false;

    unit.damage += damage;
    
    // Check if unit dies
    if (unit.damage >= (unit.card.power || 0)) {
      this.destroyUnit(unitId);
    }

    return true;
  }

  public healDamage(unitId: string, amount: number): boolean {
    const unit = this.state.units.get(unitId);
    if (!unit) return false;

    unit.damage = Math.max(0, unit.damage - amount);
    return true;
  }

  public destroyUnit(unitId: string): boolean {
    const unit = this.state.units.get(unitId);
    if (!unit) return false;

    // Remove from grid
    const square = this.state.grid[unit.position.y][unit.position.x];
    square.units = square.units.filter(u => u.id !== unitId);

    // Drop artifacts
    unit.artifacts.forEach(artifact => {
      artifact.carrier = undefined;
      artifact.position = unit.position;
    });

    // Add to cemetery
    this.state.players[unit.owner].cemetery.push(unit.card);

    // Remove from units map
    this.state.units.delete(unitId);

    return true;
  }

  public checkDeathsDoor(playerId: 'player1' | 'player2'): void {
    const player = this.state.players[playerId];
    if (player.life <= 0 && !player.atDeathsDoor) {
      player.atDeathsDoor = true;
      player.life = 0;
    }
  }

  public dealDeathBlow(playerId: 'player1' | 'player2'): void {
    const player = this.state.players[playerId];
    if (player.atDeathsDoor) {
      this.state.winner = playerId === 'player1' ? 'player2' : 'player1';
      this.state.gameOver = true;
    }
  }

  private updateElementalAffinity(playerId: 'player1' | 'player2'): void {
    const player = this.state.players[playerId];
    const affinity = { air: 0, earth: 0, fire: 0, water: 0 };

    // Count elemental symbols from controlled sites
    player.controlledSites.forEach(siteId => {
      const site = this.state.sites.get(siteId);
      if (site && site.elements) {
        site.elements.forEach(element => {
          // Map Element enum values to affinity keys
          const elementKey = element.toLowerCase() as keyof typeof affinity;
          if (elementKey in affinity) {
            affinity[elementKey]++;
          }
        });
      }
    });

    player.elementalAffinity = affinity;
  }

  public addMana(playerId: 'player1' | 'player2', amount: number): void {
    this.state.players[playerId].mana += amount;
  }

  public spendMana(playerId: 'player1' | 'player2', amount: number): boolean {
    const player = this.state.players[playerId];
    if (player.mana >= amount) {
      player.mana -= amount;
      return true;
    }
    return false;
  }

  public clearMana(playerId: 'player1' | 'player2'): void {
    this.state.players[playerId].mana = 0;
  }

  public drawCard(playerId: 'player1' | 'player2', deckType: 'spellbook' | 'atlas'): Card | null {
    const player = this.state.players[playerId];
    const deck = player.decks[deckType];
    
    if (deck.length === 0) {
      // Deck is empty - player loses
      this.state.winner = playerId === 'player1' ? 'player2' : 'player1';
      this.state.gameOver = true;
      return null;
    }

    const card = deck.shift()!;
    if (deckType === 'spellbook') {
      player.hand.spells.push(card);
    } else {
      player.hand.sites.push(card);
    }

    return card;
  }

  public addEvent(event: Omit<GameEvent, 'id'>): void {
    const gameEvent: GameEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.state.storyline.push(gameEvent);
  }

  public resolveNextEvent(): GameEvent | null {
    const event = this.state.storyline.find(e => !e.resolved);
    if (event) {
      event.resolved = true;
      return event;
    }
    return null;
  }

  public clearResolvedEvents(): void {
    this.state.storyline = this.state.storyline.filter(e => !e.resolved);
  }

  public endTurn(): void {
    // Clear damage from all units
    this.state.units.forEach(unit => {
      if (unit.id.startsWith('avatar_')) {
        // Avatars don't heal automatically
        return;
      }
      unit.damage = 0;
    });

    // Clear summoning sickness
    this.state.units.forEach(unit => {
      unit.summoning_sickness = false;
    });

    // Clear mana
    this.clearMana(this.state.phase.activePlayer);

    // Switch active player
    this.state.phase.activePlayer = this.state.phase.activePlayer === 'player1' ? 'player2' : 'player1';
    
    // Increment turn if back to first player
    if (this.state.phase.activePlayer === this.state.firstPlayer) {
      this.state.turn++;
    }

    // Reset to start phase
    this.state.phase.type = 'start';
    this.state.phase.step = 1;
  }

  public advancePhase(): void {
    if (this.state.phase.type === 'start') {
      this.state.phase.type = 'main';
    } else if (this.state.phase.type === 'main') {
      this.state.phase.type = 'end';
    } else {
      this.endTurn();
    }
  }

  // Additional utility methods needed by other modules

  public placeUnit(gameState: GameState, card: Card, owner: 'player1' | 'player2', position: Position): string | null {
    const unitId = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const unit: Unit = {
      id: unitId,
      card,
      owner,
      position,
      region: 'surface',
      isTapped: false,
      damage: 0,
      summoning_sickness: true,
      artifacts: [],
      modifiers: [],
      name: card.name,
      power: card.power,
      life: card.life,
      canAct: false,
      abilities: [], // Would be parsed from card text
      elements: card.elements?.map(e => e.toString()) || [],
      cost: card.mana_cost
    };

    gameState.units.set(unitId, unit);
    gameState.grid[position.y][position.x].units.push(unit);
    
    return unitId;
  }
}
