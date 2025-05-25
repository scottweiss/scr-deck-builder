// comboAI.ts
// Combo AI strategy for Sorcery TCG

import { GameState, Player, Unit, Position, Card } from '../../core/gameState';
import { GameAction } from '../../core/gameState';
import { BaseAIStrategy } from '../aiStrategy';

export class ComboAIStrategy extends BaseAIStrategy {
  name = 'Combo';

  evaluateGameState(gameState: GameState, player: Player): number {
    // Combo evaluation: prioritize setup pieces, engine cards, and combo completion
    let score = 0;
    
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id);
    const oppUnits = Array.from(gameState.units.values()).filter(u => u.owner !== player.id);
    const opp = player.id === 'player1' ? gameState.players.player2 : gameState.players.player1;
    
    // Value combo pieces in hand and on board
    const comboPiecesInHand = this.countComboPieces(player.hand.spells);
    const comboPiecesOnBoard = this.countComboPieces(myUnits.map(u => u.card));
    score += comboPiecesInHand * 8;
    score += comboPiecesOnBoard * 12; // Higher value for active pieces
    
    // Value mana/resource acceleration for enabling combos
    const accelerationCards = this.countAccelerationCards(player.hand.spells, myUnits.map(u => u.card));
    score += accelerationCards * 6;
    
    // Prefer having multiple elements for multi-element combos
    const elementalDiversity = this.calculateElementalDiversity(player.hand.spells, myUnits.map(u => u.card));
    score += elementalDiversity * 4;
    
    // Value spell synergy engines (cards that trigger off spells)
    const spellEngines = this.countSpellEngines(myUnits.map(u => u.card));
    score += spellEngines * 10;
    
    // Bonus for life being above critical threshold (combos need time)
    if (player.life > player.maxLife * 0.5) {
      score += 20;
    }
    
    // Penalty for opponent pressure (combo needs time to setup)
    score -= oppUnits.length * 3;
    
    return score;
  }

  generateActions(gameState: GameState, player: Player): GameAction[] {
    const actions: GameAction[] = [];
    
    // 1. Generate setup actions for combo pieces
    this.generateComboSetupActions(gameState, player, actions);
    
    // 2. Generate acceleration plays to enable combos
    this.generateAccelerationActions(gameState, player, actions);
    
    // 3. Generate protective actions to survive until combo
    this.generateProtectiveActions(gameState, player, actions);
    
    // 4. Generate combo execution actions when ready
    this.generateComboExecutionActions(gameState, player, actions);
    
    return actions;
  }

  private generateComboSetupActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    // Play combo pieces and engine cards
    const comboPieces = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isComboPiece(card)
    );
    
    for (const card of comboPieces) {
      const positions = this.getValidPlayPositions(gameState, player);
      for (const position of positions) {
        let priority = 80; // High priority for combo pieces
        
        // Higher priority for multi-element enablers
        if (this.isMultiElementCard(card)) {
          priority += 10;
        }
        
        // Higher priority for spell engines
        if (this.isSpellEngine(card)) {
          priority += 15;
        }
        
        // Higher priority for protected positions
        if (this.isProtectedPosition(gameState, position, player)) {
          priority += 5;
        }
        
        actions.push({
          type: 'PLAY_CARD',
          playerId: player.id,
          cardId: card.id,
          targetPosition: position,
          priority: priority
        });
      }
    }
  }

  private generateAccelerationActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    // Play mana acceleration and cost reduction
    const accelerationCards = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isAccelerationCard(card)
    );
    
    for (const card of accelerationCards) {
      const positions = this.getValidPlayPositions(gameState, player);
      for (const position of positions) {
        let priority = 75; // High priority for acceleration
        
        // Higher priority early game
        if (gameState.turn <= 3) {
          priority += 10;
        }
        
        // Higher priority if hand has expensive combo pieces
        if (this.hasExpensiveComboCards(player.hand.spells)) {
          priority += 15;
        }
        
        actions.push({
          type: 'PLAY_CARD',
          playerId: player.id,
          cardId: card.id,
          targetPosition: position,
          priority: priority
        });
      }
    }
  }

  private generateProtectiveActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    // Generate defensive plays to protect combo setup
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id && !u.isTapped);
    
    // Defensive positioning for key combo pieces
    for (const unit of myUnits) {
      if (this.isComboPiece(unit.card)) {
        const safePositions = this.getSafePositions(gameState, unit, player);
        for (const position of safePositions) {
          actions.push({
            type: 'MOVE',
            playerId: player.id,
            unitId: unit.id,
            sourcePosition: unit.position,
            targetPosition: position,
            priority: 60
          });
        }
      }
    }
    
    // Play defensive spells and creatures
    const defensiveCards = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isDefensiveCard(card)
    );
    
    for (const card of defensiveCards) {
      const positions = this.getValidPlayPositions(gameState, player);
      for (const position of positions) {
        actions.push({
          type: 'PLAY_CARD',
          playerId: player.id,
          cardId: card.id,
          targetPosition: position,
          priority: 45 // Lower priority than combo pieces
        });
      }
    }
  }

  private generateComboExecutionActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    // Check if combo is ready to execute
    if (!this.isComboReady(gameState, player)) {
      return;
    }
    
    // Generate win condition plays
    const winConditionCards = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      this.isWinConditionCard(card)
    );
    
    for (const card of winConditionCards) {
      const positions = this.getValidPlayPositions(gameState, player);
      for (const position of positions) {
        actions.push({
          type: 'PLAY_CARD',
          playerId: player.id,
          cardId: card.id,
          targetPosition: position,
          priority: 95 // Highest priority for combo payoff
        });
      }
    }
    
    // Chain spell effects if engines are active
    this.generateSpellChainActions(gameState, player, actions);
  }

  private generateSpellChainActions(gameState: GameState, player: Player, actions: GameAction[]): void {
    // If we have spell engines on board, prioritize casting spells for value
    const spellEngines = Array.from(gameState.units.values()).filter(u => 
      u.owner === player.id && this.isSpellEngine(u.card)
    );
    
    if (spellEngines.length === 0) {
      return;
    }
    
    const cheapSpells = player.hand.spells.filter(card => 
      this.canPlayCard(card, player, gameState) &&
      (card.cost || 0) <= 2 // Low cost spells for chaining
    );
    
    for (const card of cheapSpells) {
      const positions = this.getValidPlayPositions(gameState, player);
      for (const position of positions) {
        actions.push({
          type: 'PLAY_CARD',
          playerId: player.id,
          cardId: card.id,
          targetPosition: position,
          priority: 85 // High priority when engines are active
        });
      }
    }
  }

  // Helper methods for combo detection
  private countComboPieces(cards: Card[]): number {
    return cards.filter(card => this.isComboPiece(card)).length;
  }

  private countAccelerationCards(handCards: Card[], boardCards: Card[]): number {
    const allCards = [...handCards, ...boardCards];
    return allCards.filter(card => this.isAccelerationCard(card)).length;
  }

  private countSpellEngines(cards: Card[]): number {
    return cards.filter(card => this.isSpellEngine(card)).length;
  }

  private calculateElementalDiversity(handCards: Card[], boardCards: Card[]): number {
    const elements = new Set<string>();
    const allCards = [...handCards, ...boardCards];
    
    for (const card of allCards) {
      if (card.elements) {
        card.elements.forEach(element => elements.add(element));
      }
    }
    
    return elements.size;
  }

  private isComboPiece(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    const name = (card.name || '').toLowerCase();
    
    // Look for classic combo patterns
    return text.includes('when') || // Triggered abilities
           text.includes('whenever') ||
           text.includes('transform') ||
           text.includes('return') ||
           text.includes('search') ||
           text.includes('voidwalk') ||
           text.includes('genesis') ||
           text.includes('deathrite') ||
           name.includes('core') || // Elemental cores
           name.includes('ring') ||
           name.includes('stone') ||
           this.isMultiElementCard(card) ||
           this.isSpellEngine(card);
  }

  private isAccelerationCard(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    const name = (card.name || '').toLowerCase();
    
    return text.includes('mana') ||
           text.includes('threshold') ||
           text.includes('cost') && text.includes('less') ||
           text.includes('reduce') ||
           name.includes('core') ||
           name.includes('stone');
  }

  private isSpellEngine(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    
    return text.includes('when you cast') ||
           text.includes('when bearer cast') ||
           text.includes('spell trigger') ||
           text.includes('whenever you cast') ||
           text.includes('each time you cast');
  }

  private isMultiElementCard(card: Card): boolean {
    return (card.elements && card.elements.length > 1) ||
           (card.effect || '').toLowerCase().includes('all elements') ||
           (card.effect || '').toLowerCase().includes('aefw');
  }

  private isWinConditionCard(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    const cost = card.cost || 0;
    
    // High-cost impactful cards or direct win conditions
    return cost >= 6 ||
           text.includes('win') ||
           text.includes('destroy all') ||
           text.includes('deal') && text.includes('damage') ||
           text.includes('double') ||
           text.includes('lethal');
  }

  private isDefensiveCard(card: Card): boolean {
    const text = (card.effect || '').toLowerCase();
    
    return text.includes('prevent') ||
           text.includes('counter') ||
           text.includes('heal') ||
           text.includes('shield') ||
           text.includes('protection') ||
           card.type === 'Minion' && (card.cost || 0) >= 3; // Defensive minions
  }

  private hasExpensiveComboCards(hand: Card[]): boolean {
    return hand.some(card => 
      this.isComboPiece(card) && (card.cost || 0) >= 4
    );
  }

  private isComboReady(gameState: GameState, player: Player): boolean {
    // Check if we have enough pieces and mana for a big turn
    const myUnits = Array.from(gameState.units.values()).filter(u => u.owner === player.id);
    const engineCount = myUnits.filter(u => this.isSpellEngine(u.card)).length;
    const accelerationCount = myUnits.filter(u => this.isAccelerationCard(u.card)).length;
    
    return engineCount >= 1 && 
           accelerationCount >= 1 && 
           player.mana >= 4; // Enough mana for combo turn
  }

  private isProtectedPosition(gameState: GameState, pos: Position, player: Player): boolean {
    // Position is protected if it's away from enemy units or near our defensive units
    const nearbyEnemies = this.getUnitsInRange(gameState, pos, 2).filter(u => u.owner !== player.id);
    const nearbyAllies = this.getUnitsInRange(gameState, pos, 1).filter(u => u.owner === player.id);
    
    return nearbyEnemies.length === 0 || nearbyAllies.length >= 2;
  }

  private getSafePositions(gameState: GameState, unit: Unit, player: Player): Position[] {
    const positions: Position[] = [];
    
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 4; y++) {
        const pos = { x, y };
        if (this.canMoveToPosition(gameState, unit, pos) && 
            this.isProtectedPosition(gameState, pos, player)) {
          positions.push(pos);
        }
      }
    }
    
    return positions;
  }

  private canPlayCard(card: Card, player: Player, gameState: GameState): boolean {
    // Check mana cost
    if ((card.cost || 0) > player.mana) return false;
    // TODO: Add elemental affinity and other Sorcery-specific checks if needed
    return true;
  }
}
