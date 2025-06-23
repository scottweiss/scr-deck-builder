import { Card, Avatar, Site, Element, CardType } from '../../types';
import { Deck } from '../../types/Deck';
import { GameState, PlayerState, CardInPlay, GameAction, ActionType } from './types';

export class GameSimulation {
  private state: GameState;
  private actionHistory: GameAction[] = [];
  private listeners: ((state: GameState) => void)[] = [];

  constructor(deck1: Deck, deck2: Deck) {
    this.state = this.initializeGameState(deck1, deck2);
  }

  private initializeGameState(deck1: Deck, deck2: Deck): GameState {
    const player1 = this.initializePlayer(deck1, 1);
    const player2 = this.initializePlayer(deck2, 2);

    return {
      currentTurn: 1,
      activePlayer: 1,
      phase: 'draw',
      player1,
      player2,
      turnTimer: 90,
      lastAction: null,
      winner: null
    };
  }

  private initializePlayer(deck: Deck, playerId: 1 | 2): PlayerState {
    // Shuffle deck
    const shuffledSites = [...deck.sites].sort(() => Math.random() - 0.5);
    const shuffledSpellbook = [...deck.spellbook].sort(() => Math.random() - 0.5);

    // Draw initial hand (5 cards)
    const initialHand = shuffledSpellbook.splice(0, 5);

    return {
      id: playerId,
      avatar: deck.avatar,
      health: deck.avatar.health || 30,
      maxHealth: deck.avatar.health || 30,
      mana: 0,
      maxMana: 0,
      hand: initialHand.map((card, index) => ({
        ...card,
        instanceId: `${playerId}-hand-${index}`,
        location: 'hand'
      })),
      board: [],
      sites: shuffledSites.map((site, index) => ({
        ...site,
        instanceId: `${playerId}-site-${index}`,
        location: 'sites'
      })),
      spellbook: shuffledSpellbook.map((card, index) => ({
        ...card,
        instanceId: `${playerId}-spell-${index}`,
        location: 'spellbook'
      })),
      graveyard: [],
      activeSite: null,
      hasPlayedSite: false,
      spellsPlayedThisTurn: 0
    };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  getState(): GameState {
    return { ...this.state };
  }

  executeAction(action: GameAction): boolean {
    if (!this.validateAction(action)) {
      return false;
    }

    this.actionHistory.push(action);

    switch (action.type) {
      case 'play_site':
        return this.playSite(action);
      case 'play_card':
        return this.playCard(action);
      case 'attack':
        return this.performAttack(action);
      case 'activate_ability':
        return this.activateAbility(action);
      case 'end_turn':
        return this.endTurn(action);
      case 'mulligan':
        return this.performMulligan(action);
      default:
        return false;
    }
  }

  private validateAction(action: GameAction): boolean {
    const player = action.playerId === 1 ? this.state.player1 : this.state.player2;

    // Check if it's the player's turn
    if (this.state.activePlayer !== action.playerId) {
      return false;
    }

    switch (action.type) {
      case 'play_site':
        return !player.hasPlayedSite && player.sites.length > 0;
      case 'play_card':
        return this.canPlayCard(player, action.cardId!);
      case 'attack':
        return this.canAttack(player, action.attackerId!, action.targetId!);
      case 'end_turn':
        return true;
      default:
        return true;
    }
  }

  private canPlayCard(player: PlayerState, cardId: string): boolean {
    const card = player.hand.find(c => c.instanceId === cardId);
    if (!card) return false;

    // Check mana cost
    if ((card.mana_cost || 0) > player.mana) return false;

    // Check element requirements
    if (card.elements.length > 0 && player.activeSite) {
      const hasRequiredElement = card.elements.some(element =>
        player.activeSite!.elements.includes(element)
      );
      if (!hasRequiredElement) return false;
    }

    return true;
  }

  private canAttack(player: PlayerState, attackerId: string, targetId: string): boolean {
    const attacker = player.board.find(c => c.instanceId === attackerId);
    if (!attacker || attacker.tapped || attacker.summoningSickness) return false;

    // Check if target is valid (opponent's creature or avatar)
    const opponent = player.id === 1 ? this.state.player2 : this.state.player1;
    const validTarget = targetId === 'avatar' || 
      opponent.board.some(c => c.instanceId === targetId);

    return validTarget;
  }

  private playSite(action: GameAction): boolean {
    const player = action.playerId === 1 ? this.state.player1 : this.state.player2;
    
    if (player.sites.length === 0) return false;

    const site = player.sites.shift()!;
    player.activeSite = site;
    player.hasPlayedSite = true;
    player.maxMana++;
    player.mana = player.maxMana;

    this.state.lastAction = {
      ...action,
      description: `Player ${action.playerId} played ${site.name}`
    };

    this.notify();
    return true;
  }

  private playCard(action: GameAction): boolean {
    const player = action.playerId === 1 ? this.state.player1 : this.state.player2;
    const cardIndex = player.hand.findIndex(c => c.instanceId === action.cardId);
    
    if (cardIndex === -1) return false;

    const card = player.hand[cardIndex];
    player.mana -= card.mana_cost || 0;
    player.hand.splice(cardIndex, 1);

    if (card.type === CardType.Minion) {
      const minion: CardInPlay = {
        ...card,
        location: 'board',
        tapped: false,
        summoningSickness: true,
        damage: 0,
        modifiedAttack: card.attack,
        modifiedDefense: card.defense,
        modifiedHealth: card.health
      };
      player.board.push(minion);
    } else if (card.type === CardType.Spell) {
      // Execute spell effect
      this.executeSpellEffect(card, action.playerId, action.targetId);
      player.graveyard.push({ ...card, location: 'graveyard' });
    }

    player.spellsPlayedThisTurn++;
    this.state.lastAction = {
      ...action,
      description: `Player ${action.playerId} played ${card.name}`
    };

    this.notify();
    return true;
  }

  private executeSpellEffect(spell: Card, playerId: 1 | 2, targetId?: string) {
    // Simple spell effects based on keywords
    if (spell.abilities?.includes('Draw')) {
      this.drawCards(playerId, 1);
    }
    if (spell.abilities?.includes('Damage') && targetId) {
      this.dealDamage(targetId, 3);
    }
    if (spell.abilities?.includes('Heal')) {
      const player = playerId === 1 ? this.state.player1 : this.state.player2;
      player.health = Math.min(player.health + 5, player.maxHealth);
    }
  }

  private drawCards(playerId: 1 | 2, count: number) {
    const player = playerId === 1 ? this.state.player1 : this.state.player2;
    
    for (let i = 0; i < count; i++) {
      if (player.spellbook.length > 0 && player.hand.length < 10) {
        const card = player.spellbook.shift()!;
        player.hand.push({ ...card, location: 'hand' });
      }
    }
  }

  private dealDamage(targetId: string, amount: number) {
    if (targetId === 'avatar') {
      const opponent = this.state.activePlayer === 1 ? this.state.player2 : this.state.player1;
      opponent.health -= amount;
      
      if (opponent.health <= 0) {
        this.state.winner = this.state.activePlayer;
      }
    } else {
      // Find creature on either board
      for (const player of [this.state.player1, this.state.player2]) {
        const creature = player.board.find(c => c.instanceId === targetId);
        if (creature) {
          creature.damage += amount;
          if (creature.damage >= (creature.modifiedHealth || creature.health || 0)) {
            player.board = player.board.filter(c => c.instanceId !== targetId);
            player.graveyard.push({ ...creature, location: 'graveyard' });
          }
          break;
        }
      }
    }
  }

  private performAttack(action: GameAction): boolean {
    const player = action.playerId === 1 ? this.state.player1 : this.state.player2;
    const opponent = action.playerId === 1 ? this.state.player2 : this.state.player1;
    
    const attacker = player.board.find(c => c.instanceId === action.attackerId);
    if (!attacker) return false;

    attacker.tapped = true;

    if (action.targetId === 'avatar') {
      opponent.health -= attacker.modifiedAttack || attacker.attack || 0;
      if (opponent.health <= 0) {
        this.state.winner = action.playerId;
      }
    } else {
      const defender = opponent.board.find(c => c.instanceId === action.targetId);
      if (defender) {
        // Combat damage
        defender.damage += attacker.modifiedAttack || attacker.attack || 0;
        attacker.damage += defender.modifiedAttack || defender.attack || 0;

        // Check for deaths
        if (defender.damage >= (defender.modifiedHealth || defender.health || 0)) {
          opponent.board = opponent.board.filter(c => c.instanceId !== defender.instanceId);
          opponent.graveyard.push({ ...defender, location: 'graveyard' });
        }
        if (attacker.damage >= (attacker.modifiedHealth || attacker.health || 0)) {
          player.board = player.board.filter(c => c.instanceId !== attacker.instanceId);
          player.graveyard.push({ ...attacker, location: 'graveyard' });
        }
      }
    }

    this.state.lastAction = {
      ...action,
      description: `${attacker.name} attacked ${action.targetId}`
    };

    this.notify();
    return true;
  }

  private activateAbility(action: GameAction): boolean {
    const player = action.playerId === 1 ? this.state.player1 : this.state.player2;
    const card = [...player.board, ...player.hand].find(c => c.instanceId === action.cardId);
    
    if (!card || !card.abilities) return false;

    const abilityIndex = action.abilityIndex || 0;
    const ability = card.abilities[abilityIndex];

    if (!ability) return false;

    // Parse ability text for common patterns
    if (ability.includes('Tap:')) {
      if (card.tapped) return false;
      card.tapped = true;
    }

    // Execute ability effects
    this.executeAbilityEffect(ability, action.playerId, action.targetId);

    this.state.lastAction = {
      ...action,
      description: `${card.name} activated ability: ${ability}`
    };

    this.notify();
    return true;
  }

  private executeAbilityEffect(ability: string, playerId: 1 | 2, targetId?: string) {
    // Parse and execute common ability patterns
    const drawMatch = ability.match(/Draw (\d+) card/i);
    if (drawMatch) {
      this.drawCards(playerId, parseInt(drawMatch[1]));
    }

    const damageMatch = ability.match(/Deal (\d+) damage/i);
    if (damageMatch && targetId) {
      this.dealDamage(targetId, parseInt(damageMatch[1]));
    }

    const gainLifeMatch = ability.match(/Gain (\d+) life/i);
    if (gainLifeMatch) {
      const player = playerId === 1 ? this.state.player1 : this.state.player2;
      player.health = Math.min(player.health + parseInt(gainLifeMatch[1]), player.maxHealth);
    }

    const boostMatch = ability.match(/\+(\d+)\/\+(\d+)/);
    if (boostMatch && targetId) {
      const boostAttack = parseInt(boostMatch[1]);
      const boostHealth = parseInt(boostMatch[2]);
      this.boostCreature(targetId, boostAttack, boostHealth);
    }
  }

  private boostCreature(targetId: string, attackBoost: number, healthBoost: number) {
    for (const player of [this.state.player1, this.state.player2]) {
      const creature = player.board.find(c => c.instanceId === targetId);
      if (creature) {
        creature.modifiedAttack = (creature.modifiedAttack || creature.attack || 0) + attackBoost;
        creature.modifiedHealth = (creature.modifiedHealth || creature.health || 0) + healthBoost;
        break;
      }
    }
  }

  simulateTurn(): GameAction[] {
    const actions: GameAction[] = [];
    const player = this.state.activePlayer === 1 ? this.state.player1 : this.state.player2;
    const opponent = this.state.activePlayer === 1 ? this.state.player2 : this.state.player1;

    // Enhanced AI logic with strategy
    const strategy = this.analyzeGameState(player, opponent);

    // 1. Play a site if possible
    if (!player.hasPlayedSite && player.sites.length > 0) {
      const bestSite = this.selectBestSite(player.sites, player.hand);
      if (bestSite) {
        actions.push({
          type: 'play_site',
          playerId: this.state.activePlayer,
          siteId: bestSite.instanceId,
          timestamp: Date.now()
        });
      }
    }

    // 2. Play cards strategically
    const playableCards = player.hand.filter(card => 
      this.canPlayCard(player, card.instanceId!)
    ).sort((a, b) => this.evaluateCardPriority(a, b, strategy));
    
    let remainingMana = player.mana;
    for (const card of playableCards) {
      if (remainingMana >= (card.mana_cost || 0)) {
        const target = this.selectBestTarget(card, player, opponent);
        actions.push({
          type: 'play_card',
          playerId: this.state.activePlayer,
          cardId: card.instanceId,
          targetId: target,
          timestamp: Date.now()
        });
        remainingMana -= card.mana_cost || 0;
      }
    }

    // 3. Combat phase - attack with creatures
    const attackDecisions = this.planAttacks(player, opponent);
    for (const decision of attackDecisions) {
      actions.push({
        type: 'attack',
        playerId: this.state.activePlayer,
        attackerId: decision.attackerId,
        targetId: decision.targetId,
        timestamp: Date.now()
      });
    }

    // 4. End turn
    actions.push({
      type: 'end_turn',
      playerId: this.state.activePlayer,
      timestamp: Date.now()
    });

    return actions;
  }

  private analyzeGameState(player: PlayerState, opponent: PlayerState): AIStrategy {
    const playerBoardStrength = this.calculateBoardStrength(player.board);
    const opponentBoardStrength = this.calculateBoardStrength(opponent.board);
    const healthAdvantage = player.health - opponent.health;
    const boardAdvantage = playerBoardStrength - opponentBoardStrength;

    // Determine strategy based on game state
    if (opponent.health <= 10 && playerBoardStrength > 5) {
      return AIStrategy.Aggressive;
    } else if (player.health <= 15 || boardAdvantage < -5) {
      return AIStrategy.Defensive;
    } else if (player.hand.length > 5 && player.maxMana >= 5) {
      return AIStrategy.Control;
    } else {
      return AIStrategy.Midrange;
    }
  }

  private calculateBoardStrength(board: CardInPlay[]): number {
    return board.reduce((total, card) => {
      const attack = card.modifiedAttack || card.attack || 0;
      const health = (card.modifiedHealth || card.health || 0) - (card.damage || 0);
      return total + attack + (health * 0.5);
    }, 0);
  }

  private selectBestSite(sites: CardInPlay[], hand: CardInPlay[]): CardInPlay | null {
    if (sites.length === 0) return null;

    // Count elements needed by cards in hand
    const elementCounts: Record<string, number> = {};
    hand.forEach(card => {
      card.elements.forEach(element => {
        elementCounts[element] = (elementCounts[element] || 0) + 1;
      });
    });

    // Find site that provides the most needed elements
    let bestSite = sites[0];
    let bestScore = 0;

    sites.forEach(site => {
      let score = 0;
      site.elements.forEach(element => {
        score += elementCounts[element] || 0;
      });
      if (score > bestScore) {
        bestScore = score;
        bestSite = site;
      }
    });

    return bestSite;
  }

  private evaluateCardPriority(a: CardInPlay, b: CardInPlay, strategy: AIStrategy): number {
    // Priority based on strategy
    switch (strategy) {
      case AIStrategy.Aggressive:
        // Prioritize low-cost creatures and damage spells
        if (a.type === CardType.Minion && b.type !== CardType.Minion) return -1;
        if (a.type !== CardType.Minion && b.type === CardType.Minion) return 1;
        return (a.mana_cost || 0) - (b.mana_cost || 0);
      
      case AIStrategy.Defensive:
        // Prioritize removal and defensive creatures
        if (a.abilities?.includes('Defender') && !b.abilities?.includes('Defender')) return -1;
        if (!a.abilities?.includes('Defender') && b.abilities?.includes('Defender')) return 1;
        if (a.health && b.health) return (b.health - a.health);
        break;
      
      case AIStrategy.Control:
        // Prioritize card draw and removal
        if (a.abilities?.includes('Draw') && !b.abilities?.includes('Draw')) return -1;
        if (!a.abilities?.includes('Draw') && b.abilities?.includes('Draw')) return 1;
        break;
    }
    
    return 0;
  }

  private selectBestTarget(card: Card, player: PlayerState, opponent: PlayerState): string | undefined {
    // For damage spells, target based on threat level
    if (card.abilities?.includes('Damage')) {
      // Target strongest enemy creature or avatar if no creatures
      if (opponent.board.length > 0) {
        const threats = opponent.board
          .map(c => ({
            id: c.instanceId!,
            threat: (c.modifiedAttack || c.attack || 0) + (c.modifiedHealth || c.health || 0)
          }))
          .sort((a, b) => b.threat - a.threat);
        return threats[0].id;
      }
      return 'avatar';
    }

    // For buff spells, target our best creature
    if (card.abilities?.includes('Buff')) {
      if (player.board.length > 0) {
        const best = player.board
          .map(c => ({
            id: c.instanceId!,
            value: (c.modifiedAttack || c.attack || 0) + (c.modifiedHealth || c.health || 0)
          }))
          .sort((a, b) => b.value - a.value);
        return best[0].id;
      }
    }

    return undefined;
  }

  private planAttacks(player: PlayerState, opponent: PlayerState): AttackDecision[] {
    const decisions: AttackDecision[] = [];
    const readyAttackers = player.board.filter(c => !c.tapped && !c.summoningSickness);
    const enemyCreatures = opponent.board.filter(c => !c.abilities?.includes('Stealth'));

    // Calculate if we can deal lethal damage
    const totalDamage = readyAttackers.reduce((sum, c) => sum + (c.modifiedAttack || c.attack || 0), 0);
    const canKillOpponent = totalDamage >= opponent.health && enemyCreatures.filter(c => c.abilities?.includes('Defender')).length === 0;

    if (canKillOpponent) {
      // Go for lethal
      readyAttackers.forEach(attacker => {
        decisions.push({
          attackerId: attacker.instanceId!,
          targetId: 'avatar'
        });
      });
    } else {
      // Smart trading and board control
      const attackerAssignments = this.optimizeAttacks(readyAttackers, enemyCreatures, opponent);
      decisions.push(...attackerAssignments);
    }

    return decisions;
  }

  private optimizeAttacks(attackers: CardInPlay[], defenders: CardInPlay[], opponent: PlayerState): AttackDecision[] {
    const decisions: AttackDecision[] = [];
    const assignedAttackers = new Set<string>();
    const assignedDefenders = new Set<string>();

    // First, handle must-block defenders (with Defender ability)
    const mustBlockDefenders = defenders.filter(d => d.abilities?.includes('Defender'));
    
    // Then prioritize favorable trades
    attackers.forEach(attacker => {
      if (assignedAttackers.has(attacker.instanceId!)) return;

      const attackPower = attacker.modifiedAttack || attacker.attack || 0;
      const attackerHealth = (attacker.modifiedHealth || attacker.health || 0) - (attacker.damage || 0);

      // Find best target
      let bestTarget: { id: string, score: number } | null = null;

      defenders.forEach(defender => {
        if (assignedDefenders.has(defender.instanceId!)) return;

        const defenderPower = defender.modifiedAttack || defender.attack || 0;
        const defenderHealth = (defender.modifiedHealth || defender.health || 0) - (defender.damage || 0);

        // Calculate trade value
        let score = 0;
        
        // Can we kill it?
        if (attackPower >= defenderHealth) {
          score += 10 + (defender.mana_cost || 0);
        }
        
        // Will we survive?
        if (defenderPower < attackerHealth) {
          score += 5;
        }
        
        // Is it a good trade?
        if (attackPower >= defenderHealth && defenderPower >= attackerHealth) {
          score += (defender.mana_cost || 0) - (attacker.mana_cost || 0);
        }

        if (!bestTarget || score > bestTarget.score) {
          bestTarget = { id: defender.instanceId!, score };
        }
      });

      // Attack creature if good trade, otherwise attack avatar
      if (bestTarget && bestTarget.score > 5) {
        decisions.push({
          attackerId: attacker.instanceId!,
          targetId: bestTarget.id
        });
        assignedAttackers.add(attacker.instanceId!);
        assignedDefenders.add(bestTarget.id);
      } else if (!mustBlockDefenders.some(d => !assignedDefenders.has(d.instanceId!))) {
        // Only attack avatar if all defenders with "Defender" are handled
        decisions.push({
          attackerId: attacker.instanceId!,
          targetId: 'avatar'
        });
        assignedAttackers.add(attacker.instanceId!);
      }
    });

    return decisions;
  }

  // Add method to handle complex ability activations
  activateAbility(action: GameAction): boolean {
    const player = action.playerId === 1 ? this.state.player1 : this.state.player2;
    const card = [...player.board, ...player.hand].find(c => c.instanceId === action.cardId);
    
    if (!card || !card.abilities) return false;

    const abilityIndex = action.abilityIndex || 0;
    const ability = card.abilities[abilityIndex];

    if (!ability) return false;

    // Parse ability text for common patterns
    if (ability.includes('Tap:')) {
      if (card.tapped) return false;
      card.tapped = true;
    }

    // Execute ability effects
    this.executeAbilityEffect(ability, action.playerId, action.targetId);

    this.state.lastAction = {
      ...action,
      description: `${card.name} activated ability: ${ability}`
    };

    this.notify();
    return true;
  }
}

enum AIStrategy {
  Aggressive = 'aggressive',
  Defensive = 'defensive',
  Control = 'control',
  Midrange = 'midrange'
}

interface AttackDecision {
  attackerId: string;
  targetId: string;
}
