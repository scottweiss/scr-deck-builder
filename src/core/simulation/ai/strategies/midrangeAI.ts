// midrangeAI.ts
// Midrange AI strategy for Sorcery TCG

import { GameState, Player, Unit, Position, CardType } from '../../core/gameState';
import { Card } from '../../../../types/Card';
import { GameAction } from '../../core/gameState';
import { BaseAIStrategy } from '../aiStrategy';

export class MidrangeAIStrategy extends BaseAIStrategy {
  name = 'Midrange';

  evaluateGameState(gameState: GameState, player: Player): number {
    // Midrange evaluation: balanced approach between aggression and control
    let score = 0;
    
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id);
    const oppUnits = Array.from(gameState.units.values()).filter(u => u.owner !== player.id);
    const opp = player.id === 'player1' ? gameState.players.player2 : gameState.players.player1;
    
    // Balanced board presence evaluation
    score += myUnits.length * 5;
    score -= oppUnits.length * 3;
    
    // Card advantage is important but not overwhelming
    const handSize = player.hand.spells.length + player.hand.sites.length;
    const oppHandSize = opp.hand.spells.length + opp.hand.sites.length;
    score += (handSize - oppHandSize) * 8;
    
    // Life total matters for tempo
    score += player.life * 1.5;
    score -= (opp.maxLife - opp.life) * 2; // Some points for damage dealt
    
    // Mana efficiency - having mana to play threats
    score += player.mana * 2;
    
    // Board development tempo
    const untappedUnits = myUnits.filter(u => !u.isTapped);
    score += untappedUnits.length * 2;
    
    return score;
  }

  generateActions(gameState: GameState, player: Player): GameAction[] {
    const actions: GameAction[] = [];
    
    // 1. Generate efficient creature plays
    this.generateMidrangePlayActions(gameState, player, actions);
    
    // 2. Generate tempo-based attacks
    this.generateTempoAttackActions(gameState, player, actions);
    
    // 3. Generate utility spells
    this.generateUtilityActions(gameState, player, actions);
    
    // 4. Generate tempo movement
    this.generateTempoMovementActions(gameState, player, actions);
    
    return actions;
  }

  private generateMidrangePlayActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    if (!player.hand || !player.hand.spells) {
      return; // No hand or spells to play
    }
    
    const playableCards = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isMidrangeCard(card)
    );
    
    for (const card of playableCards) {
      const positions = this.getGoodPlayPositions(gameState, player);
      for (const position of positions) {
        let priority = 50;
        
        // Efficient mana curve plays
        const currentTurn = gameState.turn;
        if ((card.cost || 0) === currentTurn || (card.cost || 0) === currentTurn - 1) {
          priority += 15; // On-curve bonus
        }
        
        // Versatile cards get priority
        if (this.isVersatileCard(card)) {
          priority += 10;
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

  private generateTempoAttackActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id && !u.isTapped);
    
    for (const unit of myUnits) {
      // Balance between attacking and maintaining board presence
      const shouldAttack = this.shouldAttackWithUnit(gameState, unit, player);
      
      if (shouldAttack) {
        // Find good attack targets
        const targets = this.getAttackTargets(gameState, unit, player);
        
        for (const target of targets) {
          let priority = 55; // Medium priority for tempo attacks
          
          // Prioritize profitable trades
          if (this.isProfitableTrade(unit, target)) {
            priority += 15;
          }
          
          actions.push({
            type: 'ATTACK',
            playerId: player.id,
            unitId: unit.id,
            targetUnitId: target.id,
            priority
          });
        }
      }
    }
  }

  private generateUtilityActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    // Defensive check for hand.spells
    if (!player.hand?.spells) {
      return;
    }
    
    const utilitySpells = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isUtilitySpell(card)
    );
    
    for (const spell of utilitySpells) {
      let priority = 45;
      
      // Higher priority if it solves a problem
      if (this.solvesCurrentProblem(gameState, spell, player)) {
        priority += 20;
      }
      
      actions.push({
        type: 'PLAY_CARD',
        playerId: player.id,
        cardId: spell.id,
        priority
      });
    }
  }

  private generateTempoMovementActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id && !u.isTapped);
    
    for (const unit of myUnits) {
      const moveTargets = this.getTempoMovementTargets(gameState, unit, player);
      
      for (const target of moveTargets) {
        actions.push({
          type: 'MOVE',
          playerId: player.id,
          unitId: unit.id,
          sourcePosition: unit.position,
          targetPosition: target,
          priority: 42
        });
      }
    }
  }

  private isMidrangeCard(card: Card): boolean {
    // Prefer efficient, versatile cards
    const cost = card.cost || 0;
    
    if (card.type === CardType.Minion) {
      return cost >= 2 && cost <= 5; // Mid-cost creatures
    }
    
    // Versatile spells
    return this.isVersatileCard(card);
  }

  private isVersatileCard(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    return text.includes('choose') || text.includes('target') || 
           text.includes('either') || text.includes('modal');
  }

  private isUtilitySpell(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    return text.includes('draw') || text.includes('search') || 
           text.includes('destroy') || text.includes('counter');
  }

  private shouldAttackWithUnit(gameState: GameState, unit: Unit, player: Player): boolean {
    // Attack if we have board advantage or good trades available
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id);
    const oppUnits = Array.from(gameState.units.values()).filter(u => u.owner !== player.id);
    
    return myUnits.length >= oppUnits.length; // Attack when ahead on board
  }

  private getAttackTargets(gameState: GameState, unit: Unit, player: Player): Unit[] {
    const targets: Unit[] = [];
    
    // Find enemy units in range
    const enemyUnits = Array.from(gameState.units.values()).filter(u => 
      u.owner !== player.id && 
      this.isInAttackRange(unit.position, u.position)
    );
    
    targets.push(...enemyUnits);
    
    // Consider attacking avatar if profitable
    const oppPlayer = player.id === 'player1' ? gameState.players.player2 : gameState.players.player1;
    if (this.isInAttackRange(unit.position, oppPlayer.avatar.position)) {
      targets.push(oppPlayer.avatar);
    }
    
    return targets;
  }

  private isProfitableTrade(attacker: Unit, defender: Unit): boolean {
    // Simplified trade evaluation (would need actual power/toughness comparison)
    return true; // Placeholder - assume all trades are reasonable for midrange
  }

  private solvesCurrentProblem(gameState: GameState, spell: Card, player: Player): boolean {
    // Check if spell addresses current board state issues
    const oppUnits = Array.from(gameState.units.values()).filter(u => u.owner !== player.id);
    
    if (oppUnits.length > 2 && this.isRemovalSpell(spell)) {
      return true; // Removal when opponent has board
    }
    
    if (player.hand.spells.length <= 2 && this.isCardDrawSpell(spell)) {
      return true; // Card draw when low on cards
    }
    
    return false;
  }

  private isRemovalSpell(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    return text.includes('destroy') || text.includes('damage');
  }

  private isCardDrawSpell(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    return text.includes('draw');
  }

  private getGoodPlayPositions(gameState: GameState, player: Player): Position[] {
    const positions: Position[] = [];
    
    // Find positions that provide good board development
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 4; y++) {
        const square = gameState.grid[y][x];
        if (square.units.length === 0 && !square.site) {
          // Prefer central positions for midrange
          if (this.isCentralPosition({ x, y }) || this.isAdjacentToPlayerUnits(gameState, { x, y }, player.id)) {
            positions.push({ x, y });
          }
        }
      }
    }
    
    return positions;
  }

  private isCentralPosition(pos: Position): boolean {
    // Center of the board
    return pos.x >= 1 && pos.x <= 3 && pos.y >= 1 && pos.y <= 2;
  }

  private getTempoMovementTargets(gameState: GameState, unit: Unit, player: Player): Position[] {
    const targets: Position[] = [];
    
    // Move to apply pressure or improve position
    const directions = [
      {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}
    ];
    
    for (const dir of directions) {
      const newPos = {
        x: unit.position.x + dir.x,
        y: unit.position.y + dir.y
      };
      
      if (this.isValidPosition(newPos) && this.isPositionEmpty(gameState, newPos)) {
        // Prefer positions that maintain board presence
        if (this.isTacticalPosition(gameState, newPos, player)) {
          targets.push(newPos);
        }
      }
    }
    
    return targets;
  }

  private isTacticalPosition(gameState: GameState, pos: Position, player: Player): boolean {
    // Position is tactical if it maintains pressure or board control
    return this.isCentralPosition(pos) || this.isAdjacentToPlayerUnits(gameState, pos, player.id);
  }

  private canPlayCard(card: Card, player: Player, gameState: GameState): boolean {
    return (card.cost || 0) <= player.mana;
  }

  private isInAttackRange(from: Position, to: Position): boolean {
    return Math.abs(from.x - to.x) <= 1 && Math.abs(from.y - to.y) <= 1;
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

  private isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < 5 && pos.y >= 0 && pos.y < 4;
  }

  private isPositionEmpty(gameState: GameState, pos: Position): boolean {
    const square = gameState.grid[pos.y][pos.x];
    return square.units.length === 0 && !square.site;
  }
}
