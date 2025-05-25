/**
 * Enhanced board state management for Sorcery: Contested Realm
 * Part of Phase 1: Core Engine Foundation
 */

import { Card } from '../../../types/Card';
import { Position, Unit, GridSquare } from './gameState';

export interface BoardConfiguration {
  width: number;
  height: number;
  regions: RegionDefinition[];
}

export interface RegionDefinition {
  name: 'void' | 'surface' | 'underground' | 'underwater';
  positions: Position[];
  properties: RegionProperties;
}

export interface RegionProperties {
  allowsMovement: boolean;
  allowsSites: boolean;
  allowsUnits: boolean;
  movementCost: number;
  specialRules: string[];
}

export interface SiteAdjacencyRule {
  type: 'adjacent' | 'diagonal' | 'same_column' | 'same_row' | 'distance';
  value?: number;
}

export interface BoardZone {
  name: string;
  positions: Position[];
  owner?: 'player1' | 'player2' | 'neutral';
  effects: ZoneEffect[];
}

export interface ZoneEffect {
  type: 'movement_bonus' | 'spell_power' | 'mana_generation' | 'protection';
  value: number;
  conditions?: string[];
}

export interface MovementPath {
  start: Position;
  end: Position;
  path: Position[];
  cost: number;
  isValid: boolean;
  blockingUnits: Unit[];
}

export interface LineOfSight {
  from: Position;
  to: Position;
  blocked: boolean;
  blockingPositions: Position[];
  range: number;
}

export class BoardStateManager {
  private board: GridSquare[][];
  private config: BoardConfiguration;
  private zones: BoardZone[];
  private siteAdjacencyRules: SiteAdjacencyRule[];

  constructor() {
    this.config = this.getDefaultConfiguration();
    this.board = this.initializeBoard();
    this.zones = this.initializeZones();
    this.siteAdjacencyRules = this.getDefaultSiteRules();
  }

  /**
   * Get default board configuration for Sorcery: Contested Realm
   */
  private getDefaultConfiguration(): BoardConfiguration {
    return {
      width: 5,
      height: 4,
      regions: [
        {
          name: 'void',
          positions: this.getAllPositions(),
          properties: {
            allowsMovement: false,
            allowsSites: true,
            allowsUnits: false,
            movementCost: 0,
            specialRules: ['site_placement_only']
          }
        },
        {
          name: 'surface',
          positions: [],
          properties: {
            allowsMovement: true,
            allowsSites: false,
            allowsUnits: true,
            movementCost: 1,
            specialRules: []
          }
        },
        {
          name: 'underground',
          positions: [],
          properties: {
            allowsMovement: true,
            allowsSites: false,
            allowsUnits: true,
            movementCost: 1,
            specialRules: ['underground_movement']
          }
        },
        {
          name: 'underwater',
          positions: [],
          properties: {
            allowsMovement: true,
            allowsSites: false,
            allowsUnits: true,
            movementCost: 1,
            specialRules: ['underwater_movement']
          }
        }
      ]
    };
  }

  /**
   * Initialize the 5x4 game board
   */
  private initializeBoard(): GridSquare[][] {
    const board: GridSquare[][] = [];
    
    for (let y = 0; y < this.config.height; y++) {
      board[y] = [];
      for (let x = 0; x < this.config.width; x++) {
        board[y][x] = {
          position: { x, y },
          units: [],
          region: 'void', // Default to void
          isRubble: false
        };
      }
    }

    return board;
  }

  /**
   * Initialize board zones
   */
  private initializeZones(): BoardZone[] {
    return [
      {
        name: 'Player 1 Starting Zone',
        positions: [
          { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }
        ],
        owner: 'player1',
        effects: []
      },
      {
        name: 'Player 2 Starting Zone',
        positions: [
          { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }
        ],
        owner: 'player2',
        effects: []
      },
      {
        name: 'Neutral Zone',
        positions: [
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }
        ],
        owner: 'neutral',
        effects: []
      }
    ];
  }

  /**
   * Get default site adjacency rules
   */
  private getDefaultSiteRules(): SiteAdjacencyRule[] {
    return [
      { type: 'adjacent' } // Sites must be adjacent to existing sites or starting positions
    ];
  }

  /**
   * Get all positions on the board
   */
  private getAllPositions(): Position[] {
    const positions: Position[] = [];
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        positions.push({ x, y });
      }
    }
    return positions;
  }

  /**
   * Get the current board state
   */
  public getBoard(): GridSquare[][] {
    return this.board.map(row => row.map(square => ({ ...square })));
  }

  /**
   * Get a specific square on the board
   */
  public getSquare(position: Position): GridSquare | null {
    if (!this.isValidPosition(position)) return null;
    return { ...this.board[position.y][position.x] };
  }

  /**
   * Update a square on the board
   */
  public updateSquare(position: Position, updates: Partial<GridSquare>): boolean {
    if (!this.isValidPosition(position)) return false;
    
    const square = this.board[position.y][position.x];
    Object.assign(square, updates);
    
    return true;
  }

  /**
   * Check if a position is valid on the board
   */
  public isValidPosition(position: Position): boolean {
    return position.x >= 0 && position.x < this.config.width &&
           position.y >= 0 && position.y < this.config.height;
  }

  /**
   * Check if a position is empty (no units)
   */
  public isPositionEmpty(position: Position): boolean {
    const square = this.getSquare(position);
    return square ? square.units.length === 0 : false;
  }

  /**
   * Get adjacent positions to a given position
   */
  public getAdjacentPositions(position: Position, includeDiagonals: boolean = false): Position[] {
    const adjacent: Position[] = [];
    const directions = includeDiagonals
      ? [
          { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
          { x: -1, y: 0 },                   { x: 1, y: 0 },
          { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
        ]
      : [
          { x: 0, y: -1 },
          { x: -1, y: 0 }, { x: 1, y: 0 },
          { x: 0, y: 1 }
        ];

    for (const dir of directions) {
      const newPos = { x: position.x + dir.x, y: position.y + dir.y };
      if (this.isValidPosition(newPos)) {
        adjacent.push(newPos);
      }
    }

    return adjacent;
  }

  /**
   * Calculate distance between two positions
   */
  public calculateDistance(pos1: Position, pos2: Position, type: 'manhattan' | 'euclidean' = 'manhattan'): number {
    if (type === 'euclidean') {
      return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    } else {
      return Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
    }
  }

  /**
   * Find valid movement path from start to end position
   */
  public findMovementPath(start: Position, end: Position, maxMoves: number = 3): MovementPath {
    if (!this.isValidPosition(start) || !this.isValidPosition(end)) {
      return {
        start,
        end,
        path: [],
        cost: Infinity,
        isValid: false,
        blockingUnits: []
      };
    }

    // Simple pathfinding using BFS
    const queue: { position: Position; path: Position[]; cost: number }[] = [
      { position: start, path: [start], cost: 0 }
    ];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const posKey = `${current.position.x},${current.position.y}`;
      
      if (visited.has(posKey)) continue;
      visited.add(posKey);
      
      if (current.position.x === end.x && current.position.y === end.y) {
        return {
          start,
          end,
          path: current.path,
          cost: current.cost,
          isValid: current.cost <= maxMoves,
          blockingUnits: []
        };
      }
      
      if (current.cost >= maxMoves) continue;
      
      const adjacent = this.getAdjacentPositions(current.position);
      for (const nextPos of adjacent) {
        const nextPosKey = `${nextPos.x},${nextPos.y}`;
        if (!visited.has(nextPosKey)) {
          const square = this.getSquare(nextPos);
          if (square && square.region !== 'void') {
            const moveCost = this.getMovementCost(nextPos);
            queue.push({
              position: nextPos,
              path: [...current.path, nextPos],
              cost: current.cost + moveCost
            });
          }
        }
      }
    }

    return {
      start,
      end,
      path: [],
      cost: Infinity,
      isValid: false,
      blockingUnits: []
    };
  }

  /**
   * Get movement cost for a position
   */
  public getMovementCost(position: Position): number {
    const square = this.getSquare(position);
    if (!square) return Infinity;

    const region = this.config.regions.find(r => r.name === square.region);
    return region ? region.properties.movementCost : 1;
  }

  /**
   * Check line of sight between two positions
   */
  public checkLineOfSight(from: Position, to: Position): LineOfSight {
    const result: LineOfSight = {
      from,
      to,
      blocked: false,
      blockingPositions: [],
      range: this.calculateDistance(from, to)
    };

    // Bresenham's line algorithm for checking obstacles
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1;
    const sy = from.y < to.y ? 1 : -1;
    let err = dx - dy;

    let x = from.x;
    let y = from.y;

    while (x !== to.x || y !== to.y) {
      const e2 = 2 * err;
      
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      
      if (e2 < dx) {
        err += dx;
        y += sy;
      }

      const currentPos = { x, y };
      const square = this.getSquare(currentPos);
      
      if (square && square.site) {
        result.blocked = true;
        result.blockingPositions.push(currentPos);
      }
    }

    return result;
  }

  /**
   * Check if a site can be placed at a position
   */
  public canPlaceSite(position: Position, playerId: 'player1' | 'player2', existingSites: Position[]): boolean {
    const square = this.getSquare(position);
    if (!square) return false;

    // Must be void or rubble
    if (square.region !== 'void' && !square.isRubble) return false;
    
    // Must not already have a site
    if (square.site && !square.isRubble) return false;

    // Check adjacency rules
    if (existingSites.length === 0) {
      // First site can be placed in starting zones
      const playerZone = this.zones.find(z => z.owner === playerId);
      if (playerZone) {
        return playerZone.positions.some(p => p.x === position.x && p.y === position.y);
      }
    } else {
      // Must be adjacent to existing site
      return existingSites.some(sitePos => 
        this.calculateDistance(position, sitePos) === 1
      );
    }

    return false;
  }

  /**
   * Place a site at a position
   */
  public placeSite(position: Position, site: Card): boolean {
    const square = this.getSquare(position);
    if (!square) return false;

    this.board[position.y][position.x].site = site;
    this.board[position.y][position.x].region = 'surface';
    this.board[position.y][position.x].isRubble = false;

    return true;
  }

  /**
   * Remove a site from a position (make it rubble)
   */
  public destroySite(position: Position): boolean {
    const square = this.getSquare(position);
    if (!square || !square.site) return false;

    this.board[position.y][position.x].site = undefined;
    this.board[position.y][position.x].isRubble = true;
    this.board[position.y][position.x].region = 'void';

    return true;
  }

  /**
   * Get all positions with sites
   */
  public getSitePositions(): Position[] {
    const positions: Position[] = [];
    
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        if (this.board[y][x].site) {
          positions.push({ x, y });
        }
      }
    }

    return positions;
  }

  /**
   * Get all units on the board
   */
  public getAllUnits(): Unit[] {
    const units: Unit[] = [];
    
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        units.push(...this.board[y][x].units);
      }
    }

    return units;
  }

  /**
   * Add a unit to a position
   */
  public addUnit(position: Position, unit: Unit): boolean {
    const square = this.getSquare(position);
    if (!square) return false;

    // Check if position allows units
    const region = this.config.regions.find(r => r.name === square.region);
    if (!region || !region.properties.allowsUnits) return false;

    this.board[position.y][position.x].units.push(unit);
    return true;
  }

  /**
   * Remove a unit from the board
   */
  public removeUnit(unitId: string): boolean {
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const square = this.board[y][x];
        const unitIndex = square.units.findIndex(u => u.id === unitId);
        if (unitIndex >= 0) {
          square.units.splice(unitIndex, 1);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Move a unit from one position to another
   */
  public moveUnit(unitId: string, from: Position, to: Position): boolean {
    if (!this.isValidPosition(from) || !this.isValidPosition(to)) return false;

    const fromSquare = this.board[from.y][from.x];
    const unitIndex = fromSquare.units.findIndex(u => u.id === unitId);
    
    if (unitIndex < 0) return false;

    const unit = fromSquare.units.splice(unitIndex, 1)[0];
    unit.position = to;
    
    return this.addUnit(to, unit);
  }

  /**
   * Get board statistics
   */
  public getBoardStatistics(): {
    totalSites: number;
    totalUnits: number;
    rubblePositions: number;
    emptyPositions: number;
    player1Sites: number;
    player2Sites: number;
  } {
    let totalSites = 0;
    let totalUnits = 0;
    let rubblePositions = 0;
    let emptyPositions = 0;

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        const square = this.board[y][x];
        
        if (square.site) totalSites++;
        if (square.isRubble) rubblePositions++;
        if (!square.site && square.units.length === 0) emptyPositions++;
        
        totalUnits += square.units.length;
      }
    }

    // Count player-controlled sites
    const sitePositions = this.getSitePositions();
    const player1Sites = sitePositions.filter(pos => {
      const square = this.getSquare(pos);
      return square?.units.some(u => u.owner === 'player1');
    }).length;

    const player2Sites = sitePositions.filter(pos => {
      const square = this.getSquare(pos);
      return square?.units.some(u => u.owner === 'player2');
    }).length;

    return {
      totalSites,
      totalUnits,
      rubblePositions,
      emptyPositions,
      player1Sites,
      player2Sites
    };
  }

  /**
   * Reset the board to initial state
   */
  public reset(): void {
    this.board = this.initializeBoard();
    this.zones = this.initializeZones();
  }

  /**
   * Export board state for saving/loading
   */
  public exportState(): any {
    return {
      board: this.board,
      config: this.config,
      zones: this.zones
    };
  }

  /**
   * Import board state from saved data
   */
  public importState(data: any): boolean {
    try {
      this.board = data.board;
      this.config = data.config;
      this.zones = data.zones;
      return true;
    } catch {
      return false;
    }
  }
}
