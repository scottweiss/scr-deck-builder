// aggressiveAI.ts
// Aggressive AI strategy for Sorcery TCG

import { GameState, Player, Unit, Position } from '../../core/gameState';
import { Card } from '../../../../types/Card';
import { GameAction } from '../../core/gameState';
import { BaseAIStrategy } from '../aiStrategy';

export class AggressiveAIStrategy extends BaseAIStrategy {
  name = 'Aggressive';

  evaluateGameState(gameState: GameState, player: Player): number {
    // Aggressive evaluation: prioritize board presence and dealing damage
    let score = 0;
    
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id);
    const oppUnits = Array.from(gameState.units.values()).filter(u => u.owner !== player.id);
    const opp = player.id === 'player1' ? gameState.players.player2 : gameState.players.player1;
    
    // Heavily weight board presence
    score += myUnits.length * 8;
    
    // Value damage dealt to opponent
    score += (opp.maxLife - opp.life) * 10;
    
    // Prefer having units ready to attack (untapped)
    const untappedUnits = myUnits.filter(u => !u.isTapped);
    score += untappedUnits.length * 3;
    
    // Bonus for having more units (since power property not available)
    const totalUnits = myUnits.length;
    score += totalUnits * 2;
    
    // Penalty for opponent having board presence
    score -= oppUnits.length * 4;
    
    return score;
  }

  generateActions(gameState: GameState, player: Player): GameAction[] {
    const actions: GameAction[] = [];
    
    // 1. Generate attack actions for all available units
    this.generateAttackActions(gameState, player, actions);
    
    // 2. Generate aggressive unit plays
    this.generateAggressivePlayActions(gameState, player, actions);
    
    // 3. Generate movement actions to position for attacks
    this.generateAggressiveMovementActions(gameState, player, actions);
    
    // 4. Generate direct damage spells
    this.generateDirectDamageActions(gameState, player, actions);
    
    return actions;
  }

  private generateAttackActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id && !u.isTapped);
    
    for (const unit of myUnits) {
      // Find enemy units in attack range
      const enemyUnits = Array.from(gameState.units.values()).filter(u => 
        u.owner !== player.id && 
        this.isInAttackRange(unit.position, u.position)
      );
      
      for (const target of enemyUnits) {
        actions.push({
          type: 'ATTACK',
          playerId: player.id,
          unitId: unit.id,
          targetUnitId: target.id,
          priority: 70 // High priority for aggressive AI
        });
      }
      
      // Also consider attacking opponent's avatar if in range
      const oppPlayer = player.id === 'player1' ? gameState.players.player2 : gameState.players.player1;
      if (this.isInAttackRange(unit.position, oppPlayer.avatar.position)) {
        actions.push({
          type: 'ATTACK',
          playerId: player.id,
          unitId: unit.id,
          targetUnitId: oppPlayer.avatar.id,
          priority: 85 // Very high priority - go for the kill
        });
      }
    }
  }

  private generateAggressivePlayActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    // Play low-cost, high-impact creatures
    const playableCards = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isAggressiveCard(card)
    );
    
    for (const card of playableCards) {
      const positions = this.getValidPlayPositions(gameState, player);
      for (const position of positions) {
        let priority = 50;
        
        // Boost priority for low-cost cards (aggressive preference)
        if ((card.cost || 0) <= 2) {
          priority += 20;
        }
        
        // Boost priority if card has charge or haste-like abilities
        if (card.keywords?.includes('charge')) {
          priority += 15;
        }
        
        actions.push({
          type: 'PLAY_CARD',
          playerId: player.id,
          cardId: card.id,
          targetPosition: position,
          priority
        });
      }
    }
  }

  private generateAggressiveMovementActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id && !u.isTapped);
    
    for (const unit of myUnits) {
      // Move towards opponent's avatar or units
      const moveTargets = this.getAggressiveMovementTargets(gameState, unit, player);
      
      for (const target of moveTargets) {
        actions.push({
          type: 'MOVE',
          playerId: player.id,
          unitId: unit.id,
          sourcePosition: unit.position,
          targetPosition: target,
          priority: 40
        });
      }
    }
  }

  private generateDirectDamageActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    const damageSpells = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isDamageSpell(card)
    );
    
    for (const spell of damageSpells) {
      // Target opponent's avatar preferentially
      const oppPlayer = player.id === 'player1' ? gameState.players.player2 : gameState.players.player1;
      actions.push({
        type: 'PLAY_CARD',
        playerId: player.id,
        cardId: spell.id,
        targetUnitId: oppPlayer.avatar.id,
        priority: 75 // High priority for direct damage
      });
    }
  }

  private isAggressiveCard(card: Card): boolean {
    // Prefer low-cost minions
    if (card.type === 'Minion') {
      return (card.cost || 0) <= 3; // Low cost minions for aggression
    }
    
    // Prefer direct damage spells
    return this.isDamageSpell(card);
  }

  private isDamageSpell(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    return text.includes('damage') || text.includes('destroy') || text.includes('strike');
  }

  private isInAttackRange(from: Position, to: Position): boolean {
    // Adjacent positions (simplified - would need proper range calculation)
    return Math.abs(from.x - to.x) <= 1 && Math.abs(from.y - to.y) <= 1;
  }

  private canPlayCard(card: Card, player: Player, gameState: GameState): boolean {
    // Check mana cost
    if ((card.cost || 0) > player.mana) return false;
    
    // Check elemental requirements (simplified)
    // Would need proper elemental affinity checking
    
    return true;
  }

  private getValidPlayPositions(gameState: GameState, player: Player): Position[] {
    const positions: Position[] = [];
    
    // Find empty positions adjacent to player's units
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 4; y++) {
        const square = gameState.grid[y][x];
        if (square.units.length === 0 && !square.site) {
          // Check if adjacent to player's units
          if (this.isAdjacentToPlayerUnits(gameState, { x, y }, player.id)) {
            positions.push({ x, y });
          }
        }
      }
    }
    
    return positions;
  }

  private isAdjacentToPlayerUnits(gameState: GameState, pos: Position, playerId: string): boolean {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const checkX = pos.x + dx;
        const checkY = pos.y + dy;
        
        if (checkX >= 0 && checkX < 5 && checkY >= 0 && checkY < 4) {
          const square = gameState.grid[checkY][checkX];
          if (square.units.some(u => u.owner === playerId)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private getAggressiveMovementTargets(gameState: GameState, unit: Unit, player: Player): Position[] {
    const targets: Position[] = [];
    const oppPlayer = player.id === 'player1' ? gameState.players.player2 : gameState.players.player1;
    
    // Move towards opponent's avatar
    const avatarPos = oppPlayer.avatar.position;
    const directions = this.getDirectionsTowards(unit.position, avatarPos);
    
    for (const dir of directions) {
      const newPos = {
        x: unit.position.x + dir.x,
        y: unit.position.y + dir.y
      };
      
      if (this.isValidPosition(newPos) && this.isPositionEmpty(gameState, newPos)) {
        targets.push(newPos);
      }
    }
    
    return targets;
  }

  private getDirectionsTowards(from: Position, to: Position): Array<{x: number, y: number}> {
    const directions: Array<{x: number, y: number}> = [];
    
    if (to.x > from.x) directions.push({x: 1, y: 0});
    if (to.x < from.x) directions.push({x: -1, y: 0});
    if (to.y > from.y) directions.push({x: 0, y: 1});
    if (to.y < from.y) directions.push({x: 0, y: -1});
    
    return directions;
  }

  private isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < 5 && pos.y >= 0 && pos.y < 4;
  }

  private isPositionEmpty(gameState: GameState, pos: Position): boolean {
    const square = gameState.grid[pos.y][pos.x];
    return square.units.length === 0 && !square.site;
  }
}
