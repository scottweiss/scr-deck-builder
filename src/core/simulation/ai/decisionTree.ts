// Decision tree algorithms for AI strategic decision making

import { GameState, Player, Unit, Position, Card, GameAction } from '../core/gameState';
import { GameStateEvaluator } from './gameStateEvaluator';

export interface DecisionNode {
  id: string;
  depth: number;
  gameState: GameState;
  player: 'player1' | 'player2';
  actions: GameAction[];
  evaluation: number;
  children: DecisionNode[];
  bestAction?: GameAction;
  isTerminal: boolean;
  alpha: number;
  beta: number;
}

export interface TreeSearchConfig {
  maxDepth: number;
  maxBranching: number;
  timeLimit: number;
  enablePruning: boolean;
  evaluationDepth: number;
}

export class DecisionTree {
  private evaluator: GameStateEvaluator;
  private config: TreeSearchConfig;
  private nodeCount: number = 0;
  private pruneCount: number = 0;

  constructor(config: Partial<TreeSearchConfig> = {}) {
    this.evaluator = new GameStateEvaluator();
    this.config = {
      maxDepth: 4,
      maxBranching: 5,
      timeLimit: 5000, // 5 seconds
      enablePruning: true,
      evaluationDepth: 2,
      ...config
    };
  }

  /**
   * Find the best action using minimax with alpha-beta pruning
   */
  public findBestAction(
    gameState: GameState, 
    player: 'player1' | 'player2',
    availableActions: GameAction[]
  ): GameAction | null {
    this.nodeCount = 0;
    this.pruneCount = 0;
    const startTime = Date.now();

    // Filter and sort actions by priority
    const topActions = this.selectTopActions(availableActions);
    
    const rootNode: DecisionNode = {
      id: 'root',
      depth: 0,
      gameState: this.cloneGameState(gameState),
      player,
      actions: topActions,
      evaluation: 0,
      children: [],
      isTerminal: false,
      alpha: -Infinity,
      beta: Infinity
    };

    const result = this.minimax(rootNode, this.config.maxDepth, true, -Infinity, Infinity, startTime);
    
    console.log(`Decision tree search completed:
      - Nodes evaluated: ${this.nodeCount}
      - Nodes pruned: ${this.pruneCount}
      - Best evaluation: ${result.evaluation}
      - Time taken: ${Date.now() - startTime}ms`);

    return result.bestAction || null;
  }

  /**
   * Minimax algorithm with alpha-beta pruning
   */
  private minimax(
    node: DecisionNode,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    startTime: number
  ): DecisionNode {
    this.nodeCount++;

    // Check time limit
    if (Date.now() - startTime > this.config.timeLimit) {
      node.evaluation = this.evaluatePosition(node.gameState, node.player);
      node.isTerminal = true;
      return node;
    }

    // Terminal node check
    if (depth === 0 || this.isGameOver(node.gameState)) {
      node.evaluation = this.evaluatePosition(node.gameState, node.player);
      node.isTerminal = true;
      return node;
    }

    node.alpha = alpha;
    node.beta = beta;

    if (isMaximizing) {
      let maxEval = -Infinity;
      let bestAction: GameAction | undefined;

      for (const action of node.actions) {
        // Simulate action
        const newGameState = this.simulateAction(node.gameState, action);
        const nextPlayer = this.getNextPlayer(node.player);
        const nextActions = this.generateActions(newGameState, nextPlayer);

        const childNode: DecisionNode = {
          id: `${node.id}_${action.type}_${this.nodeCount}`,
          depth: node.depth + 1,
          gameState: newGameState,
          player: nextPlayer,
          actions: this.selectTopActions(nextActions),
          evaluation: 0,
          children: [],
          isTerminal: false,
          alpha,
          beta
        };

        const result = this.minimax(childNode, depth - 1, false, alpha, beta, startTime);
        node.children.push(result);

        if (result.evaluation > maxEval) {
          maxEval = result.evaluation;
          bestAction = action;
        }

        alpha = Math.max(alpha, result.evaluation);

        // Alpha-beta pruning
        if (this.config.enablePruning && beta <= alpha) {
          this.pruneCount++;
          break;
        }
      }

      node.evaluation = maxEval;
      node.bestAction = bestAction;
    } else {
      let minEval = Infinity;
      let bestAction: GameAction | undefined;

      for (const action of node.actions) {
        // Simulate action
        const newGameState = this.simulateAction(node.gameState, action);
        const nextPlayer = this.getNextPlayer(node.player);
        const nextActions = this.generateActions(newGameState, nextPlayer);

        const childNode: DecisionNode = {
          id: `${node.id}_${action.type}_${this.nodeCount}`,
          depth: node.depth + 1,
          gameState: newGameState,
          player: nextPlayer,
          actions: this.selectTopActions(nextActions),
          evaluation: 0,
          children: [],
          isTerminal: false,
          alpha,
          beta
        };

        const result = this.minimax(childNode, depth - 1, true, alpha, beta, startTime);
        node.children.push(result);

        if (result.evaluation < minEval) {
          minEval = result.evaluation;
          bestAction = action;
        }

        beta = Math.min(beta, result.evaluation);

        // Alpha-beta pruning
        if (this.config.enablePruning && beta <= alpha) {
          this.pruneCount++;
          break;
        }
      }

      node.evaluation = minEval;
      node.bestAction = bestAction;
    }

    return node;
  }

  /**
   * Select the top actions to limit branching factor
   */
  private selectTopActions(actions: GameAction[]): GameAction[] {
    return actions
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, this.config.maxBranching);
  }

  /**
   * Evaluate a game position from the perspective of a player
   */
  private evaluatePosition(gameState: GameState, player: 'player1' | 'player2'): number {
    const playerObj = gameState.players[player];
    const evaluation = GameStateEvaluator.evaluateGameState(gameState, player);
    return evaluation.winProbability;
  }

  /**
   * Simulate an action and return the resulting game state
   */
  private simulateAction(gameState: GameState, action: GameAction): GameState {
    const newState = this.cloneGameState(gameState);
    
    // Apply the action to the cloned state
    try {
      switch (action.type) {
        case 'PLAY_CARD':
          this.simulatePlayCard(newState, action);
          break;
        case 'MOVE':
          this.simulateMove(newState, action);
          break;
        case 'ATTACK':
          this.simulateAttack(newState, action);
          break;
        case 'ACTIVATE_ABILITY':
          this.simulateActivateAbility(newState, action);
          break;
        case 'PASS':
          // No simulation needed for pass
          break;
      }
    } catch (error) {
      console.warn('Error simulating action:', error);
    }

    return newState;
  }

  /**
   * Generate possible actions for a player
   */
  private generateActions(gameState: GameState, player: 'player1' | 'player2'): GameAction[] {
    const actions: GameAction[] = [];
    const playerObj = gameState.players[player];

    // Generate card play actions
    for (const card of playerObj.hand.spells) {
      if (this.canPlayCard(gameState, playerObj, card)) {
        const positions = this.getValidPlayPositions(gameState, playerObj);
        for (const position of positions) {
          actions.push({
            type: 'PLAY_CARD',
            playerId: player,
            cardId: card.id,
            targetPosition: position,
            priority: this.estimateActionValue(gameState, 'PLAY_CARD', card)
          });
        }
      }
    }

    // Generate movement actions
    const myUnits = Array.from(gameState.units.values()).filter(u => 
      u.owner === player && !u.isTapped
    );

    for (const unit of myUnits) {
      const movePositions = this.getValidMovePositions(gameState, unit);
      for (const position of movePositions) {
        actions.push({
          type: 'MOVE',
          playerId: player,
          unitId: unit.id,
          sourcePosition: unit.position,
          targetPosition: position,
          priority: this.estimateActionValue(gameState, 'MOVE', unit.card)
        });
      }

      // Generate attack actions
      const targets = this.getAttackTargets(gameState, unit);
      for (const target of targets) {
        actions.push({
          type: 'ATTACK',
          playerId: player,
          unitId: unit.id,
          targetUnitId: target.id,
          priority: this.estimateActionValue(gameState, 'ATTACK', unit.card) + 20
        });
      }
    }

    // Always include pass as an option
    actions.push({
      type: 'PASS',
      playerId: player,
      priority: 10
    });

    return actions;
  }

  /**
   * Estimate the value of an action for prioritization
   */
  private estimateActionValue(
    gameState: GameState, 
    actionType: string, 
    card?: Card
  ): number {
    let value = 30; // Base value

    if (card) {
      value += (card.cost || 0) * 5; // Higher cost cards tend to be more valuable
      if (card.type === 'Creature') {
        value += 10; // Creatures provide board presence
      }
    }

    if (actionType === 'ATTACK') {
      value += 25; // Attacks are generally high priority
    }

    return value;
  }

  // Simulation helper methods
  private simulatePlayCard(gameState: GameState, action: GameAction): void {
    const player = gameState.players[action.playerId];
    const card = player.hand.spells.find(c => c.id === action.cardId);
    
    if (!card || !action.targetPosition) return;

    // Remove card from hand
    player.hand.spells = player.hand.spells.filter(c => c.id !== action.cardId);
    
    // Deduct mana
    player.mana -= card.cost || 0;

    // Add unit to board if it's a creature
    if (card.type === 'Creature') {
      const unitId = `sim_unit_${Date.now()}_${Math.random()}`;
      const unit: Unit = {
        id: unitId,
        card,
        owner: action.playerId,
        position: action.targetPosition,
        region: 'surface',
        isTapped: false,
        damage: 0,
        summoning_sickness: true,
        artifacts: [],
        modifiers: []
      };

      gameState.units.set(unitId, unit);
      gameState.grid[action.targetPosition.y][action.targetPosition.x].units.push(unit);
    }
  }

  private simulateMove(gameState: GameState, action: GameAction): void {
    if (!action.unitId || !action.targetPosition || !action.sourcePosition) return;

    const unit = gameState.units.get(action.unitId);
    if (!unit) return;

    // Remove from old position
    const oldSquare = gameState.grid[action.sourcePosition.y][action.sourcePosition.x];
    oldSquare.units = oldSquare.units.filter(u => u.id !== action.unitId);

    // Add to new position
    unit.position = action.targetPosition;
    const newSquare = gameState.grid[action.targetPosition.y][action.targetPosition.x];
    newSquare.units.push(unit);
  }

  private simulateAttack(gameState: GameState, action: GameAction): void {
    if (!action.unitId || !action.targetUnitId) return;

    const attacker = gameState.units.get(action.unitId);
    const target = gameState.units.get(action.targetUnitId);
    
    if (!attacker || !target) return;

    // Simple combat simulation
    const attackerPower = this.getUnitPower(attacker);
    const targetLife = this.getUnitLife(target);

    if (attackerPower >= targetLife) {
      // Target dies
      this.destroyUnit(gameState, target);
    } else {
      // Target takes damage
      target.damage += attackerPower;
    }

    // Attacker taps
    attacker.isTapped = true;
  }

  private simulateActivateAbility(gameState: GameState, action: GameAction): void {
    // Simplified ability simulation
    if (action.unitId) {
      const unit = gameState.units.get(action.unitId);
      if (unit) {
        unit.isTapped = true;
      }
    }
  }

  // Utility methods
  private cloneGameState(gameState: GameState): GameState {
    return JSON.parse(JSON.stringify(gameState));
  }

  private isGameOver(gameState: GameState): boolean {
    return gameState.gameOver || 
           gameState.players.player1.life <= 0 || 
           gameState.players.player2.life <= 0;
  }

  private getNextPlayer(currentPlayer: 'player1' | 'player2'): 'player1' | 'player2' {
    return currentPlayer === 'player1' ? 'player2' : 'player1';
  }

  private canPlayCard(gameState: GameState, player: Player, card: Card): boolean {
    return player.mana >= (card.cost || 0);
  }

  private getValidPlayPositions(gameState: GameState, player: Player): Position[] {
    const positions: Position[] = [];
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 4; y++) {
        const square = gameState.grid[y][x];
        if (square.units.length === 0 && !square.site) {
          positions.push({ x, y });
        }
      }
    }
    return positions.slice(0, 3); // Limit for performance
  }

  private getValidMovePositions(gameState: GameState, unit: Unit): Position[] {
    const positions: Position[] = [];
    const { x, y } = unit.position;

    // Check adjacent positions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const newX = x + dx;
        const newY = y + dy;
        
        if (newX >= 0 && newX < 5 && newY >= 0 && newY < 4) {
          const square = gameState.grid[newY][newX];
          if (square.units.length === 0) {
            positions.push({ x: newX, y: newY });
          }
        }
      }
    }

    return positions;
  }

  private getAttackTargets(gameState: GameState, unit: Unit): Unit[] {
    const targets: Unit[] = [];
    const { x, y } = unit.position;

    // Check adjacent positions for enemy units
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const newX = x + dx;
        const newY = y + dy;
        
        if (newX >= 0 && newX < 5 && newY >= 0 && newY < 4) {
          const square = gameState.grid[newY][newX];
          const enemyUnits = square.units.filter(u => u.owner !== unit.owner);
          targets.push(...enemyUnits);
        }
      }
    }

    return targets;
  }

  private getUnitPower(unit: Unit): number {
    return unit.power || (unit.card.power ? unit.card.power : 1);
  }

  private getUnitLife(unit: Unit): number {
    const baseLife = unit.life || (unit.card.life ? unit.card.life : 1);
    return Math.max(0, baseLife - unit.damage);
  }

  private destroyUnit(gameState: GameState, unit: Unit): void {
    // Remove from grid
    const square = gameState.grid[unit.position.y][unit.position.x];
    square.units = square.units.filter(u => u.id !== unit.id);

    // Remove from units map
    gameState.units.delete(unit.id);

    // Add to cemetery
    gameState.players[unit.owner].cemetery.push(unit.card);
  }
}

/**
 * Monte Carlo Tree Search implementation for more advanced AI
 */
export class MonteCarloTreeSearch {
  private config: {
    iterations: number;
    explorationConstant: number;
    simulationDepth: number;
  };

  constructor(config: Partial<typeof this.config> = {}) {
    this.config = {
      iterations: 1000,
      explorationConstant: Math.sqrt(2),
      simulationDepth: 10,
      ...config
    };
  }

  public findBestAction(
    gameState: GameState,
    player: 'player1' | 'player2',
    availableActions: GameAction[]
  ): GameAction | null {
    // MCTS implementation would go here
    // For now, return the first action as a placeholder
    return availableActions[0] || null;
  }
}
