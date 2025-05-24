/**
 * Turn-based game engine for Sorcery: Contested Realm match simulation
 */

import { GameStateManager, GameState, Player, Unit, Position } from './gameState';
import { Card } from '../../types/Card';

export interface TurnAction {
  type: 'play_site' | 'cast_spell' | 'move_attack' | 'activate_ability' | 'pass';
  playerId: 'player1' | 'player2';
  details: any;
}

export interface SpellCastAction {
  spellId: string;
  caster: string; // Unit ID
  targetPosition?: Position;
  targetUnit?: string;
}

export interface MoveAttackAction {
  unitId: string;
  movement: Position[];
  attackTarget?: string | Position; // Unit ID or site position
}

export class TurnEngine {
  private gameState: GameStateManager;
  private turnHistory: TurnAction[] = [];

  constructor(gameState: GameStateManager) {
    this.gameState = gameState;
  }

  public getValidActions(): TurnAction[] {
    const state = this.gameState.getState();
    const currentPlayer = this.gameState.getCurrentPlayer();
    const actions: TurnAction[] = [];

    switch (state.phase.type) {
      case 'start':
        actions.push(...this.getStartPhaseActions());
        break;
      case 'main':
        actions.push(...this.getMainPhaseActions());
        break;
      case 'end':
        actions.push(...this.getEndPhaseActions());
        break;
    }

    return actions;
  }

  private getStartPhaseActions(): TurnAction[] {
    const state = this.gameState.getState();
    const actions: TurnAction[] = [];

    switch (state.phase.step) {
      case 1:
        // Auto-untap phase
        this.processUntapPhase();
        break;
      case 2:
        // Auto-mana phase
        this.processManaPhase();
        break;
      case 3:
        // Auto-triggered abilities phase
        this.processTriggeredAbilities();
        break;
      case 4:
        // Draw card phase
        actions.push({
          type: 'pass',
          playerId: state.phase.activePlayer,
          details: { action: 'draw_card' }
        });
        break;
    }

    return actions;
  }

  private getMainPhaseActions(): TurnAction[] {
    const state = this.gameState.getState();
    const currentPlayer = this.gameState.getCurrentPlayer();
    const actions: TurnAction[] = [];

    // Play site actions
    if (currentPlayer.hand.sites.length > 0) {
      const validSitePositions = this.getValidSitePositions();
      currentPlayer.hand.sites.forEach((site, index) => {
        validSitePositions.forEach(position => {
          actions.push({
            type: 'play_site',
            playerId: state.phase.activePlayer,
            details: { siteIndex: index, position }
          });
        });
      });
    }

    // Cast spell actions
    if (currentPlayer.hand.spells.length > 0) {
      const spellcastingUnits = this.getSpellcastingUnits(state.phase.activePlayer);
      currentPlayer.hand.spells.forEach((spell, index) => {
        spellcastingUnits.forEach(caster => {
          if (this.canCastSpell(spell, caster)) {
            const targetPositions = this.getValidSpellTargets(spell, caster);
            targetPositions.forEach(target => {
              actions.push({
                type: 'cast_spell',
                playerId: state.phase.activePlayer,
                details: { spellIndex: index, casterId: caster.id, target }
              });
            });
          }
        });
      });
    }

    // Move and attack actions
    const playerUnits = this.getPlayerUnits(state.phase.activePlayer);
    playerUnits.forEach(unit => {
      if (!unit.isTapped && !unit.summoning_sickness) {
        const moveOptions = this.getValidMoveOptions(unit);
        moveOptions.forEach(moveOption => {
          actions.push({
            type: 'move_attack',
            playerId: state.phase.activePlayer,
            details: moveOption
          });
        });
      }
    });

    // Pass action
    actions.push({
      type: 'pass',
      playerId: state.phase.activePlayer,
      details: { action: 'end_main_phase' }
    });

    return actions;
  }

  private getEndPhaseActions(): TurnAction[] {
    // End phase is typically automatic
    return [{
      type: 'pass',
      playerId: this.gameState.getState().phase.activePlayer,
      details: { action: 'end_turn' }
    }];
  }

  public executeAction(action: TurnAction): boolean {
    try {
      switch (action.type) {
        case 'play_site':
          return this.executePlaySite(action);
        case 'cast_spell':
          return this.executeCastSpell(action);
        case 'move_attack':
          return this.executeMoveAttack(action);
        case 'pass':
          return this.executePass(action);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return false;
    }
  }

  private executePlaySite(action: TurnAction): boolean {
    const { siteIndex, position } = action.details;
    const currentPlayer = this.gameState.getCurrentPlayer();
    
    if (siteIndex >= currentPlayer.hand.sites.length) {
      return false;
    }

    const site = currentPlayer.hand.sites[siteIndex];
    
    // Check if position is valid
    if (!this.isValidSitePosition(position)) {
      return false;
    }

    // Play the site
    if (this.gameState.playSite(site, position, action.playerId)) {
      // Remove from hand
      currentPlayer.hand.sites.splice(siteIndex, 1);
      
      // Add mana immediately
      this.gameState.addMana(action.playerId, 1);
      
      // Add event
      this.gameState.addEvent({
        type: 'site_play',
        activePlayer: action.playerId,
        description: `${action.playerId} plays ${site.name} at (${position.x}, ${position.y})`,
        targetPosition: position,
        resolved: false
      });

      this.turnHistory.push(action);
      return true;
    }

    return false;
  }

  private executeCastSpell(action: TurnAction): boolean {
    const { spellIndex, casterId, target } = action.details;
    const currentPlayer = this.gameState.getCurrentPlayer();
    
    if (spellIndex >= currentPlayer.hand.spells.length) {
      return false;
    }

    const spell = currentPlayer.hand.spells[spellIndex];
    const caster = this.gameState.getState().units.get(casterId);
    
    if (!caster || !this.canCastSpell(spell, caster)) {
      return false;
    }

    // Check mana cost
    const manaCost = spell.mana_cost || 0;
    if (!this.gameState.spendMana(action.playerId, manaCost)) {
      return false;
    }

    // Execute spell effect
    this.executeSpellEffect(spell, caster, target);

    // Remove from hand
    currentPlayer.hand.spells.splice(spellIndex, 1);

    // Add to cemetery
    currentPlayer.cemetery.push(spell);

    // Add event
    this.gameState.addEvent({
      type: 'spell_cast',
      activePlayer: action.playerId,
      description: `${caster.card.name} casts ${spell.name}`,
      sourceUnit: casterId,
      targetPosition: target?.position,
      targetUnit: target?.unitId,
      resolved: false
    });

    this.turnHistory.push(action);
    return true;
  }

  private executeMoveAttack(action: TurnAction): boolean {
    const { unitId, movement, attackTarget } = action.details;
    const unit = this.gameState.getState().units.get(unitId);
    
    if (!unit || unit.isTapped || unit.summoning_sickness) {
      return false;
    }

    // Tap the unit
    unit.isTapped = true;

    // Execute movement
    if (movement && movement.length > 0) {
      const finalPosition = movement[movement.length - 1];
      this.gameState.moveUnit(unitId, unit.position, finalPosition);
      
      this.gameState.addEvent({
        type: 'unit_move',
        activePlayer: action.playerId,
        description: `${unit.card.name} moves to (${finalPosition.x}, ${finalPosition.y})`,
        sourceUnit: unitId,
        targetPosition: finalPosition,
        resolved: false
      });
    }

    // Execute attack if specified
    if (attackTarget) {
      this.executeAttack(unit, attackTarget);
    }

    this.turnHistory.push(action);
    return true;
  }

  private executePass(action: TurnAction): boolean {
    const state = this.gameState.getState();
    
    switch (action.details.action) {
      case 'draw_card':
        // Draw a card (player chooses)
        if (state.turn === 1 && state.phase.activePlayer === state.firstPlayer) {
          // First player doesn't draw on first turn
        } else {
          // For AI, randomly choose spellbook or atlas
          const deckType = Math.random() < 0.7 ? 'spellbook' : 'atlas';
          this.gameState.drawCard(action.playerId, deckType);
        }
        this.gameState.advancePhase();
        break;
        
      case 'end_main_phase':
        this.gameState.advancePhase();
        break;
        
      case 'end_turn':
        this.gameState.advancePhase(); // This will end the turn
        break;
    }

    this.turnHistory.push(action);
    return true;
  }

  private processUntapPhase(): void {
    const state = this.gameState.getState();
    const currentPlayer = this.gameState.getCurrentPlayer();
    
    // Untap all units
    state.units.forEach(unit => {
      if (unit.owner === currentPlayer.id) {
        unit.isTapped = false;
      }
    });

    // Auto-advance to next step
    state.phase.step = 2;
  }

  private processManaPhase(): void {
    const state = this.gameState.getState();
    const currentPlayer = this.gameState.getCurrentPlayer();
    
    // Add mana from sites
    const manaFromSites = currentPlayer.controlledSites.length;
    this.gameState.addMana(currentPlayer.id, manaFromSites);

    // Auto-advance to next step
    state.phase.step = 3;
  }

  private processTriggeredAbilities(): void {
    // For now, just auto-advance
    // TODO: Implement triggered ability resolution
    this.gameState.getState().phase.step = 4;
  }

  private getValidSitePositions(): Position[] {
    const state = this.gameState.getState();
    const currentPlayer = this.gameState.getCurrentPlayer();
    const positions: Position[] = [];

    // Sites can be played on void or rubble, adjacent to controlled sites or avatar
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 5; x++) {
        const position = { x, y };
        if (this.isValidSitePosition(position)) {
          positions.push(position);
        }
      }
    }

    return positions;
  }

  private isValidSitePosition(position: Position): boolean {
    const state = this.gameState.getState();
    const square = state.grid[position.y][position.x];
    const currentPlayer = this.gameState.getCurrentPlayer();

    // Must be void or rubble
    if (square.site && !square.isRubble) {
      return false;
    }

    // Must be adjacent to controlled site or avatar
    const adjacentPositions = this.getAdjacentPositions(position);
    
    // Check for avatar
    if (currentPlayer.avatar.position.x === position.x && currentPlayer.avatar.position.y === position.y) {
      return true;
    }

    // Check for adjacent controlled sites
    for (const adjPos of adjacentPositions) {
      const adjSquare = state.grid[adjPos.y][adjPos.x];
      if (adjSquare.site) {
        const siteId = `site_${adjPos.x}_${adjPos.y}`;
        if (currentPlayer.controlledSites.includes(siteId)) {
          return true;
        }
      }
    }

    return false;
  }

  private getAdjacentPositions(position: Position): Position[] {
    const positions: Position[] = [];
    const directions = [
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: 1 }
    ];

    for (const dir of directions) {
      const newX = position.x + dir.x;
      const newY = position.y + dir.y;
      
      if (newX >= 0 && newX < 5 && newY >= 0 && newY < 4) {
        positions.push({ x: newX, y: newY });
      }
    }

    return positions;
  }

  private getSpellcastingUnits(playerId: 'player1' | 'player2'): Unit[] {
    const state = this.gameState.getState();
    const units: Unit[] = [];

    state.units.forEach(unit => {
      if (unit.owner === playerId && this.canCastSpells(unit)) {
        units.push(unit);
      }
    });

    return units;
  }

  private canCastSpells(unit: Unit): boolean {
    // All avatars can cast spells
    if (unit.id.startsWith('avatar_')) {
      return true;
    }

    // Check if unit has spellcaster ability
    const text = (unit.card.text || unit.card.extDescription || '').toLowerCase();
    return text.includes('spellcaster');
  }

  private canCastSpell(spell: Card, caster: Unit): boolean {
    const currentPlayer = this.gameState.getCurrentPlayer();
    
    // Check mana cost
    const manaCost = spell.mana_cost || 0;
    if (currentPlayer.mana < manaCost) {
      return false;
    }

    // Check elemental threshold
    if (spell.elements && spell.elements.length > 0) {
      for (const element of spell.elements) {
        const required = 1; // Simplified - should parse threshold
        const elementKey = element.toLowerCase() as keyof typeof currentPlayer.elementalAffinity;
        const available = currentPlayer.elementalAffinity[elementKey] || 0;
        if (available < required) {
          return false;
        }
      }
    }

    return true;
  }

  private getValidSpellTargets(spell: Card, caster: Unit): any[] {
    // Simplified targeting - return empty array for now
    // TODO: Implement proper spell targeting based on spell text
    return [{}];
  }

  private getPlayerUnits(playerId: 'player1' | 'player2'): Unit[] {
    const state = this.gameState.getState();
    const units: Unit[] = [];

    state.units.forEach(unit => {
      if (unit.owner === playerId) {
        units.push(unit);
      }
    });

    return units;
  }

  private getValidMoveOptions(unit: Unit): any[] {
    const options: any[] = [];
    const adjacentPositions = this.getAdjacentPositions(unit.position);

    // Basic move (no attack)
    adjacentPositions.forEach(position => {
      options.push({
        unitId: unit.id,
        movement: [position]
      });
    });

    // Move and attack options
    adjacentPositions.forEach(movePos => {
      const unitsAtPosition = this.gameState.getUnitsAt(movePos);
      const enemyUnits = unitsAtPosition.filter(u => u.owner !== unit.owner);
      
      enemyUnits.forEach(target => {
        options.push({
          unitId: unit.id,
          movement: [movePos],
          attackTarget: target.id
        });
      });
    });

    return options;
  }

  private executeSpellEffect(spell: Card, caster: Unit, target: any): void {
    // Simplified spell execution
    // TODO: Implement proper spell effect parsing and execution
    
    if (spell.type?.toString().includes('Minion')) {
      this.summonMinion(spell, caster.owner, caster.position);
    }
    // Add other spell types as needed
  }

  private summonMinion(minionCard: Card, owner: 'player1' | 'player2', position: Position): void {
    const minionId = `minion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const minion: Unit = {
      id: minionId,
      card: minionCard,
      owner,
      position,
      region: 'surface',
      isTapped: false,
      damage: 0,
      summoning_sickness: true,
      artifacts: [],
      modifiers: []
    };

    this.gameState.getState().units.set(minionId, minion);
    this.gameState.getState().grid[position.y][position.x].units.push(minion);
  }

  private executeAttack(attacker: Unit, target: string | Position): void {
    if (typeof target === 'string') {
      // Attacking a unit
      const targetUnit = this.gameState.getState().units.get(target);
      if (targetUnit) {
        this.resolveCombat([attacker], [targetUnit]);
      }
    } else {
      // Attacking a site
      const site = this.gameState.getSiteAt(target);
      if (site) {
        const opponentPlayer = this.gameState.getOpponentPlayer();
        opponentPlayer.life -= attacker.card.power || 0;
        this.gameState.checkDeathsDoor(opponentPlayer.id);
      }
    }
  }

  private resolveCombat(attackers: Unit[], defenders: Unit[]): void {
    // Simplified combat resolution
    attackers.forEach(attacker => {
      defenders.forEach(defender => {
        // Both units deal damage to each other
        const attackerDamage = attacker.card.power || 0;
        const defenderDamage = defender.card.power || 0;

        this.gameState.dealDamage(defender.id, attackerDamage, attacker.id);
        this.gameState.dealDamage(attacker.id, defenderDamage, defender.id);
      });
    });
  }

  public getTurnHistory(): TurnAction[] {
    return [...this.turnHistory];
  }

  public isGameOver(): boolean {
    return this.gameState.getState().gameOver;
  }

  public getWinner(): 'player1' | 'player2' | 'draw' | undefined {
    return this.gameState.getState().winner;
  }

  // Missing methods required by other modules
  
  public canPlayCard(gameState: GameState, playerId: 'player1' | 'player2', cardId: string): boolean {
    const player = gameState.players[playerId];
    const spellCard = [...player.hand.spells, ...player.hand.sites].find(c => c.name === cardId);
    
    if (!spellCard) return false;
    
    // Check mana cost
    if (player.mana < (spellCard.mana_cost || 0)) {
      return false;
    }
    
    // Check elemental requirements
    if (spellCard.elements && spellCard.elements.length > 0) {
      for (const element of spellCard.elements) {
        const elementKey = element.toLowerCase() as keyof typeof player.elementalAffinity;
        const available = player.elementalAffinity[elementKey] || 0;
        if (available < 1) {
          return false;
        }
      }
    }
    
    return true;
  }

  public canPlaceAt(gameState: GameState, card: Card, position: Position): boolean {
    if (position.x < 0 || position.x >= 5 || position.y < 0 || position.y >= 4) {
      return false;
    }
    
    const square = gameState.grid[position.y][position.x];
    
    // Sites can only be placed on void or rubble
    if (card.type === 'Site') {
      return !square.site || square.isRubble;
    }
    
    return true;
  }

  public canMoveUnit(gameState: GameState, unitId: string): boolean {
    const unit = gameState.units.get(unitId);
    if (!unit) return false;
    
    // Can't move if tapped or has summoning sickness
    return !unit.isTapped && !unit.summoning_sickness;
  }

  public canMoveToPosition(gameState: GameState, unitId: string, position: Position): boolean {
    const unit = gameState.units.get(unitId);
    if (!unit) return false;
    
    if (position.x < 0 || position.x >= 5 || position.y < 0 || position.y >= 4) {
      return false;
    }
    
    // Basic adjacency check (can be enhanced)
    const dx = Math.abs(position.x - unit.position.x);
    const dy = Math.abs(position.y - unit.position.y);
    
    return dx <= 1 && dy <= 1 && (dx + dy > 0);
  }

  public startTurn(gameState: GameState): void {
    // Process start of turn
    gameState.phase.type = 'start';
    gameState.phase.step = 1;
    
    // Untap all units controlled by active player
    gameState.units.forEach(unit => {
      if (unit.owner === gameState.phase.activePlayer) {
        unit.isTapped = false;
      }
    });
    
    // Add mana
    const player = gameState.players[gameState.phase.activePlayer];
    this.gameState.addMana(gameState.phase.activePlayer, gameState.turn);
    
    // Draw card
    if (Math.random() < 0.5) {
      this.gameState.drawCard(gameState.phase.activePlayer, 'spellbook');
    } else {
      this.gameState.drawCard(gameState.phase.activePlayer, 'atlas');
    }
    
    // Move to main phase
    gameState.phase.type = 'main';
  }

  public endTurn(gameState: GameState): void {
    // Process end of turn cleanup
    this.gameState.endTurn();
  }
}
