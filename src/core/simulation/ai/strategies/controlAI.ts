// controlAI.ts
// Control AI strategy for Sorcery TCG

import { GameState, Player, Unit, Position, Card } from '../../core/gameState';
import { GameAction } from '../../core/gameState';
import { BaseAIStrategy } from '../aiStrategy';

export class ControlAIStrategy extends BaseAIStrategy {
  name = 'Control';

  evaluateGameState(gameState: GameState, player: Player): number {
    // Control evaluation: prioritize card advantage and board control
    let score = 0;
    
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id);
    const oppUnits = Array.from(gameState.units.values()).filter(u => u.owner !== player.id);
    const opp = player.id === 'player1' ? gameState.players.player2 : gameState.players.player1;
    
    // Value card advantage heavily
    const handSize = player.hand.spells.length + player.hand.sites.length;
    const oppHandSize = opp.hand.spells.length + opp.hand.sites.length;
    score += (handSize - oppHandSize) * 15;
    
    // Value board control over raw aggression
    score += myUnits.length * 3;
    score -= oppUnits.length * 5; // Heavily penalize opponent's board presence
    
    // Value life total (stay alive to win late)
    score += player.life * 2;
    
    // Value mana availability for responses
    score += player.mana * 3;
    
    // Bonus for defensive positioning (units not tapped)
    const untappedUnits = myUnits.filter(u => !u.isTapped);
    score += untappedUnits.length * 4;
    
    return score;
  }

  generateActions(gameState: GameState, player: Player): GameAction[] {
    const actions: GameAction[] = [];
    
    // 1. Generate defensive/removal actions
    this.generateRemovalActions(gameState, player, actions);
    
    // 2. Generate card advantage plays
    this.generateCardAdvantageActions(gameState, player, actions);
    
    // 3. Generate defensive creature plays
    this.generateDefensivePlayActions(gameState, player, actions);
    
    // 4. Generate defensive positioning
    this.generateDefensiveMovementActions(gameState, player, actions);
    
    return actions;
  }

  private generateRemovalActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    if (!player.hand?.spells) {
      return;
    }
    
    const removalSpells = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isRemovalSpell(card)
    );
    
    for (const spell of removalSpells) {
      // Target opponent's most threatening units
      const threats = this.getThreateningUnits(gameState, player);
      
      for (const threat of threats) {
        actions.push({
          type: 'PLAY_CARD',
          playerId: player.id,
          cardId: spell.id,
          targetUnitId: threat.id,
          priority: 80 // High priority for removal
        });
      }
    }
  }

  private generateCardAdvantageActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    if (!player.hand?.spells) {
      return;
    }
    
    const cardDrawSpells = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isCardAdvantageSpell(card)
    );
    
    for (const spell of cardDrawSpells) {
      actions.push({
        type: 'PLAY_CARD',
        playerId: player.id,
        cardId: spell.id,
        priority: 60 // Medium-high priority for card advantage
      });
    }
  }

  private generateDefensivePlayActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    if (!player.hand?.spells) {
      return;
    }
    
    const defensiveCards = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isDefensiveCard(card)
    );
    
    for (const card of defensiveCards) {
      const positions = this.getDefensivePositions(gameState, player);
      for (const position of positions) {
        let priority = 40;
        
        // Higher priority if we're under pressure
        const oppUnits = Array.from(gameState.units.values()).filter(u => u.owner !== player.id);
        if (oppUnits.length > 2) {
          priority += 20;
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

  private generateDefensiveMovementActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id && !u.isTapped);
    
    for (const unit of myUnits) {
      // Move to defensive positions or to block key areas
      const defensiveTargets = this.getDefensiveMovementTargets(gameState, unit, player);
      
      for (const target of defensiveTargets) {
        actions.push({
          type: 'MOVE',
          playerId: player.id,
          unitId: unit.id,
          sourcePosition: unit.position,
          targetPosition: target,
          priority: 35 // Lower priority than reactive spells
        });
      }
    }
  }

  private isRemovalSpell(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    return text.includes('destroy') || text.includes('banish') || 
           text.includes('damage') || text.includes('exile');
  }

  private isCardAdvantageSpell(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    return text.includes('draw') || text.includes('search') || 
           text.includes('return') || text.includes('cycle');
  }

  private isDefensiveCard(card: Card): boolean {
    // Prefer higher cost, defensive creatures
    if (card.type === 'Creature') {
      return (card.cost || 0) >= 3; // Higher cost usually means better stats
    }
    
    // Defensive spells
    const text = (card.effect || '').toLowerCase();
    return text.includes('prevent') || text.includes('counter') || 
           text.includes('heal') || text.includes('shield');
  }

  private getThreateningUnits(gameState: GameState, player: Player): Unit[] {
    const oppUnits = Array.from(gameState.units.values()).filter(u => u.owner !== player.id);
    
    // For now, return all opponent units as threats (would need more sophisticated threat assessment)
    return oppUnits.filter(u => !u.isTapped); // Prefer removing untapped threats
  }

  private getDefensivePositions(gameState: GameState, player: Player): Position[] {
    const positions: Position[] = [];
    
    // Find positions that protect key areas or avatar
    const avatar = player.avatar;
    
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 4; y++) {
        const square = gameState.grid[y][x];
        if (square.units.length === 0 && !square.site) {
          // Check if position is defensive (near avatar or between avatar and threats)
          if (this.isDefensivePosition(gameState, { x, y }, player)) {
            positions.push({ x, y });
          }
        }
      }
    }
    
    return positions;
  }

  private isDefensivePosition(gameState: GameState, pos: Position, player: Player): boolean {
    // Position is defensive if it's near the avatar or blocks enemy approach
    const avatar = player.avatar;
    const distanceToAvatar = Math.abs(pos.x - avatar.position.x) + Math.abs(pos.y - avatar.position.y);
    
    return distanceToAvatar <= 2; // Close to avatar for protection
  }

  private getDefensiveMovementTargets(gameState: GameState, unit: Unit, player: Player): Position[] {
    const targets: Position[] = [];
    const avatar = player.avatar;
    
    // Move towards avatar for protection
    const directions = this.getDirectionsTowards(unit.position, avatar.position);
    
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

  private canPlayCard(card: Card, player: Player, gameState: GameState): boolean {
    return (card.cost || 0) <= player.mana;
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
