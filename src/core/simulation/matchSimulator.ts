import { GameState, Card, Player } from './gameState';
import { GameStateManager } from './gameState';
import { TurnEngine } from './turnEngine';
import { AIEngine, AIStrategy, AI_STRATEGIES } from './aiEngine';
import { CombatSystem } from './combatSystem';
import { SpellEffectSystem } from './spellEffectSystem';

export interface SimulationConfig {
    player1Deck: Card[];
    player2Deck: Card[];
    player1Strategy: AIStrategy;
    player2Strategy: AIStrategy;
    maxTurns: number;
    timeoutMs: number;
    enableLogging: boolean;
    seed?: number;
}

export interface SimulationResult {
    winner: string | null; // Player ID or null for tie
    reason: 'life' | 'timeout' | 'deck' | 'concede';
    turns: number;
    finalGameState: GameState;
    gameLog: GameLogEntry[];
    statistics: GameStatistics;
    duration: number; // milliseconds
}

export interface GameLogEntry {
    turn: number;
    phase: string;
    playerId: string;
    action: string;
    details: any;
    timestamp: number;
}

export interface GameStatistics {
    totalActions: number;
    spellsCast: number;
    unitsPlayed: number;
    combatResolutions: number;
    damageDealt: { [playerId: string]: number };
    cardsDrawn: { [playerId: string]: number };
    manaSpent: { [playerId: string]: number };
    averageDecisionTime: number;
}

export class MatchSimulator {
    private gameStateManager: GameStateManager;
    private turnEngine: TurnEngine;
    private combatSystem: CombatSystem;
    private spellSystem: SpellEffectSystem;
    private aiEngines: { [playerId: string]: AIEngine };
    private gameLog: GameLogEntry[];
    private statistics: GameStatistics;
    private startTime: number;

    constructor() {
        this.gameStateManager = new GameStateManager();
        this.turnEngine = new TurnEngine(this.gameStateManager);
        this.combatSystem = new CombatSystem();
        this.spellSystem = new SpellEffectSystem();
        this.aiEngines = {};
        this.gameLog = [];
        this.statistics = this.initializeStatistics();
        this.startTime = 0;
    }

    /**
     * Runs a complete match simulation
     */
    public async simulateMatch(config: SimulationConfig): Promise<SimulationResult> {
        this.startTime = Date.now();
        this.gameLog = [];
        this.statistics = this.initializeStatistics();

        try {
            // Initialize game
            const gameState = this.initializeGame(config);
            
            // Set up AI engines
            this.setupAIEngines(gameState, config);
            
            this.log(0, 'setup', 'system', 'Game initialized', {
                player1: gameState.currentPlayerId,
                player2: Object.keys(gameState.players).find(id => id !== gameState.currentPlayerId)
            });

            // Main game loop
            let turns = 0;
            let winner: string | null = null;
            let reason: SimulationResult['reason'] = 'timeout';

            while (turns < config.maxTurns && !winner) {
                turns++;
                
                if (config.enableLogging) {
                    console.log(`--- Turn ${turns} (Player: ${gameState.currentPlayerId}) ---`);
                }

                try {
                    // Execute turn
                    const turnResult = await this.executeTurn(gameState, config);
                    
                    // Check win conditions
                    const winCheck = this.checkWinConditions(gameState);
                    if (winCheck.winner) {
                        winner = winCheck.winner;
                        reason = winCheck.reason;
                        break;
                    }

                    // Check timeout
                    if (Date.now() - this.startTime > config.timeoutMs) {
                        reason = 'timeout';
                        break;
                    }

                } catch (error) {
                    console.error(`Error during turn ${turns}:`, error);
                    break;
                }
            }

            const duration = Date.now() - this.startTime;

            return {
                winner,
                reason,
                turns,
                finalGameState: gameState,
                gameLog: this.gameLog,
                statistics: this.statistics,
                duration
            };

        } catch (error) {
            console.error('Simulation error:', error);
            throw error;
        }
    }

    /**
     * Executes a complete turn for the current player
     */
    private async executeTurn(gameState: GameState, config: SimulationConfig): Promise<void> {
        const playerId = gameState.currentPlayerId;
        const aiEngine = this.aiEngines[playerId];

        // Start phase
        this.turnEngine.startTurn(gameState);
        this.log(gameState.turn, 'start', playerId, 'Turn started', {});

        // Main phase - AI makes decisions
        let actionsThisTurn = 0;
        const maxActionsPerTurn = 20; // Prevent infinite loops

        while (gameState.phase === 'main' && actionsThisTurn < maxActionsPerTurn) {
            const decisionStart = Date.now();
            const decision = await aiEngine.makeDecision(gameState, playerId);
            const decisionTime = Date.now() - decisionStart;
            
            this.updateDecisionTime(decisionTime);

            if (decision.type === 'pass') {
                this.log(gameState.turn, 'main', playerId, 'Pass', { reasoning: decision.reasoning });
                break;
            }

            try {
                const actionResult = await this.executeAIDecision(gameState, playerId, decision);
                if (actionResult.success) {
                    actionsThisTurn++;
                    this.statistics.totalActions++;
                    
                    this.log(gameState.turn, 'main', playerId, decision.type, {
                        decision,
                        result: actionResult
                    });
                } else {
                    this.log(gameState.turn, 'main', playerId, 'Failed action', {
                        decision,
                        error: actionResult.error
                    });
                    break; // If action fails, end turn
                }
            } catch (error) {
                console.error('Error executing AI decision:', error);
                break;
            }
        }

        // End phase
        this.turnEngine.endTurn(gameState);
        this.log(gameState.turn, 'end', playerId, 'Turn ended', {
            actionsThisTurn
        });
    }

    /**
     * Executes an AI decision
     */
    private async executeAIDecision(
        gameState: GameState, 
        playerId: string, 
        decision: any
    ): Promise<{ success: boolean; error?: string }> {
        try {
            switch (decision.type) {
                case 'play_card':
                    return this.executePlayCard(gameState, playerId, decision);
                    
                case 'move_unit':
                    return this.executeMoveUnit(gameState, playerId, decision);
                    
                case 'attack':
                    return this.executeAttack(gameState, playerId, decision);
                    
                case 'activate_ability':
                    return this.executeActivateAbility(gameState, playerId, decision);
                    
                default:
                    return { success: false, error: `Unknown decision type: ${decision.type}` };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    private executePlayCard(gameState: GameState, playerId: string, decision: any): { success: boolean; error?: string } {
        if (!this.turnEngine.canPlayCard(gameState, playerId, decision.cardId)) {
            return { success: false, error: 'Cannot play card' };
        }

        const card = this.findCardInHand(gameState, playerId, decision.cardId);
        if (!card) {
            return { success: false, error: 'Card not found in hand' };
        }

        // Deduct mana
        const player = gameState.players[playerId];
        player.mana -= card.cost || 0;
        this.statistics.manaSpent[playerId] = (this.statistics.manaSpent[playerId] || 0) + (card.cost || 0);

        // Remove from hand
        const handIndex = player.hand.findIndex(c => c.id === decision.cardId);
        if (handIndex >= 0) {
            player.hand.splice(handIndex, 1);
        }

        // Execute card effect based on type
        switch (card.type.toLowerCase()) {
            case 'unit':
            case 'minion':
                this.playUnit(gameState, card, playerId, decision.targetPosition);
                this.statistics.unitsPlayed++;
                break;
                
            case 'spell':
                this.playSpell(gameState, card, playerId, decision.targets || []);
                this.statistics.spellsCast++;
                break;
                
            case 'site':
                this.playSite(gameState, card, playerId, decision.targetPosition);
                break;
        }

        return { success: true };
    }

    private executeMoveUnit(gameState: GameState, playerId: string, decision: any): { success: boolean; error?: string } {
        if (!this.turnEngine.canMoveUnit(gameState, decision.unitId)) {
            return { success: false, error: 'Cannot move unit' };
        }

        const unit = gameState.units[decision.unitId];
        if (!unit || unit.ownerId !== playerId) {
            return { success: false, error: 'Invalid unit' };
        }

        if (!this.turnEngine.canMoveToPosition(gameState, decision.unitId, decision.targetPosition)) {
            return { success: false, error: 'Cannot move to position' };
        }

        // Clear old position
        gameState.grid[unit.position.x][unit.position.y].unit = null;
        
        // Set new position
        unit.position = decision.targetPosition;
        gameState.grid[decision.targetPosition.x][decision.targetPosition.y].unit = decision.unitId;
        
        // Mark as used
        unit.canAct = false;

        return { success: true };
    }

    private executeAttack(gameState: GameState, playerId: string, decision: any): { success: boolean; error?: string } {
        if (!this.combatSystem.canInitiateCombat(gameState, decision.unitId, decision.targetUnitId)) {
            return { success: false, error: 'Cannot initiate combat' };
        }

        const combatResult = this.combatSystem.resolveCombat(gameState, decision.unitId, decision.targetUnitId);
        
        // Update statistics
        this.statistics.combatResolutions++;
        this.statistics.damageDealt[playerId] = (this.statistics.damageDealt[playerId] || 0) + combatResult.defenderDamage;
        
        // Mark attacker as used
        const attacker = gameState.units[decision.unitId];
        if (attacker) {
            attacker.canAct = false;
        }

        return { success: true };
    }

    private executeActivateAbility(gameState: GameState, playerId: string, decision: any): { success: boolean; error?: string } {
        // Simplified ability activation - would need more sophisticated implementation
        return { success: true };
    }

    private playUnit(gameState: GameState, card: Card, playerId: string, position: any): void {
        const unitId = `unit_${card.id}_${Date.now()}`;
        const unit = {
            id: unitId,
            cardId: card.id,
            name: card.name,
            ownerId: playerId,
            position: position,
            power: card.power || 0,
            life: card.life || 0,
            damage: 0,
            canAct: false, // Summoning sickness
            abilities: card.abilities || [],
            elements: card.elements || [],
            artifacts: [],
            modifiers: [],
            isAvatar: false
        };

        gameState.units[unitId] = unit;
        gameState.grid[position.x][position.y].unit = unitId;
    }

    private playSpell(gameState: GameState, card: Card, playerId: string, targets: any[]): void {
        // Execute spell effects
        this.spellSystem.executeSpell(gameState, card, playerId, targets);
        
        // Move to graveyard
        const player = gameState.players[playerId];
        player.graveyard.push(card);
    }

    private playSite(gameState: GameState, card: Card, playerId: string, position: any): void {
        gameState.grid[position.x][position.y].site = {
            id: card.id,
            name: card.name,
            ownerId: playerId,
            abilities: card.abilities || [],
            elements: card.elements || []
        };
    }

    private initializeGame(config: SimulationConfig): GameState {
        // Create players
        const player1Id = 'player1';
        const player2Id = 'player2';

        const players = {
            [player1Id]: this.createPlayer(player1Id, config.player1Deck),
            [player2Id]: this.createPlayer(player2Id, config.player2Deck)
        };

        return this.gameStateManager.initializeGame(players, player1Id);
    }

    private createPlayer(id: string, deck: Card[]): Player {
        // Shuffle deck
        const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);
        
        // Draw opening hand
        const hand = shuffledDeck.splice(0, 7);

        return {
            id,
            life: 25,
            mana: 0,
            elementalAffinities: { air: 0, earth: 0, fire: 0, water: 0 },
            hand,
            deck: shuffledDeck,
            graveyard: [],
            avatarPosition: { x: id === 'player1' ? 0 : 4, y: 1 }
        };
    }

    private setupAIEngines(gameState: GameState, config: SimulationConfig): void {
        this.aiEngines = {};
        
        for (const playerId of Object.keys(gameState.players)) {
            const strategy = playerId === 'player1' ? config.player1Strategy : config.player2Strategy;
            this.aiEngines[playerId] = new AIEngine(strategy, this.turnEngine);
        }
    }

    private checkWinConditions(gameState: GameState): { winner: string | null; reason: SimulationResult['reason'] } {
        // Check life totals
        for (const [playerId, player] of Object.entries(gameState.players)) {
            if (player.life <= 0) {
                const winner = Object.keys(gameState.players).find(id => id !== playerId) || null;
                return { winner, reason: 'life' };
            }
        }

        // Check if player has no cards left
        for (const [playerId, player] of Object.entries(gameState.players)) {
            if (player.deck.length === 0 && player.hand.length === 0) {
                const winner = Object.keys(gameState.players).find(id => id !== playerId) || null;
                return { winner, reason: 'deck' };
            }
        }

        return { winner: null, reason: 'timeout' };
    }

    private findCardInHand(gameState: GameState, playerId: string, cardId: string): Card | null {
        const player = gameState.players[playerId];
        return player.hand.find(c => c.id === cardId) || null;
    }

    private initializeStatistics(): GameStatistics {
        return {
            totalActions: 0,
            spellsCast: 0,
            unitsPlayed: 0,
            combatResolutions: 0,
            damageDealt: {},
            cardsDrawn: {},
            manaSpent: {},
            averageDecisionTime: 0
        };
    }

    private updateDecisionTime(time: number): void {
        const current = this.statistics.averageDecisionTime;
        const total = this.statistics.totalActions;
        this.statistics.averageDecisionTime = (current * total + time) / (total + 1);
    }

    private log(turn: number, phase: string, playerId: string, action: string, details: any): void {
        this.gameLog.push({
            turn,
            phase,
            playerId,
            action,
            details,
            timestamp: Date.now()
        });
    }
}

/**
 * Utility class for running multiple simulations and analyzing results
 */
export class SimulationBatch {
    private simulator: MatchSimulator;

    constructor() {
        this.simulator = new MatchSimulator();
    }

    /**
     * Runs multiple simulations and returns aggregated results
     */
    public async runBatch(
        config: SimulationConfig, 
        iterations: number
    ): Promise<BatchResult> {
        const results: SimulationResult[] = [];
        const start = Date.now();

        for (let i = 0; i < iterations; i++) {
            try {
                const result = await this.simulator.simulateMatch({
                    ...config,
                    seed: config.seed ? config.seed + i : undefined
                });
                results.push(result);

                if (config.enableLogging && i % 10 === 0) {
                    console.log(`Completed ${i + 1}/${iterations} simulations`);
                }
            } catch (error) {
                console.error(`Simulation ${i + 1} failed:`, error);
            }
        }

        const duration = Date.now() - start;
        return this.analyzeResults(results, duration, config);
    }

    private analyzeResults(results: SimulationResult[], duration: number, config: SimulationConfig): BatchResult {
        const player1Wins = results.filter(r => r.winner === 'player1').length;
        const player2Wins = results.filter(r => r.winner === 'player2').length;
        const ties = results.filter(r => r.winner === null).length;

        const averageTurns = results.reduce((sum, r) => sum + r.turns, 0) / results.length;
        const averageGameDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

        const winReasons = {
            life: results.filter(r => r.reason === 'life').length,
            timeout: results.filter(r => r.reason === 'timeout').length,
            deck: results.filter(r => r.reason === 'deck').length,
            concede: results.filter(r => r.reason === 'concede').length
        };

        return {
            totalGames: results.length,
            player1Wins,
            player2Wins,
            ties,
            player1WinRate: player1Wins / results.length,
            player2WinRate: player2Wins / results.length,
            averageTurns,
            averageGameDuration,
            winReasons,
            batchDuration: duration,
            config,
            detailedResults: results
        };
    }
}

export interface BatchResult {
    totalGames: number;
    player1Wins: number;
    player2Wins: number;
    ties: number;
    player1WinRate: number;
    player2WinRate: number;
    averageTurns: number;
    averageGameDuration: number;
    winReasons: {
        life: number;
        timeout: number;
        deck: number;
        concede: number;
    };
    batchDuration: number;
    config: SimulationConfig;
    detailedResults: SimulationResult[];
}
