import { CardType, Card } from '../../../types/Card';

import { GameState, Player } from './gameState';
import { GameStateManager } from './gameState';
import { TurnEngine } from './turnEngine';
import { AIEngine } from './aiEngine';
import { AIStrategy } from '../ai/aiStrategy';
import { CombatSystem } from './combatSystem';
import { SpellEffectSystem } from './spellEffectSystem';

export interface PlayerDeck {
    avatar: Card;
    spells: Card[];
    sites: Card[];
}

export interface SimulationConfig {
    player1Deck?: PlayerDeck;
    player2Deck?: PlayerDeck;
    player1Strategy: AIStrategy;
    player2Strategy: AIStrategy;
    player1Difficulty?: import('../ai/difficultyManager').AIDifficulty;
    player2Difficulty?: import('../ai/difficultyManager').AIDifficulty;
    maxTurns: number;
    timeoutMs?: number;
    enableLogging: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    seed?: number;
}

export interface SimulationResult {
    winner: 'player1' | 'player2' | null; // Player ID or null for tie
    reason: 'life' | 'timeout' | 'deck' | 'concede';
    turns: number;
    finalGameState: GameState;
    gameLog: GameLogEntry[];
    statistics: GameStatistics;
    duration: number; // milliseconds
    // Additional properties for AI vs AI testing
    finalState?: GameState;
    totalTurns?: number;
    winCondition?: 'life' | 'timeout' | 'deck' | 'concede';
}

export interface GameLogEntry {
    turn: number;
    phase: string;
    playerId: 'player1' | 'player2';
    action: string;
    details: any;
    timestamp: number;
}

export interface GameStatistics {
    totalActions: number;
    spellsCast: number;
    unitsPlayed: number;
    combatResolutions: number;
    damageDealt: { player1: number; player2: number };
    cardsDrawn: { player1: number; player2: number };
    manaSpent: { player1: number; player2: number };
    averageDecisionTime: number;
}

export class MatchSimulator {
    private gameStateManager: GameStateManager;
    private turnEngine: TurnEngine;
    private combatSystem: CombatSystem | null;
    private spellSystem: SpellEffectSystem;
    private aiEngines: { player1?: AIEngine; player2?: AIEngine };
    private gameLog: GameLogEntry[];
    private statistics: GameStatistics;
    private startTime: number;

    constructor() {
        this.gameStateManager = new GameStateManager();
        this.turnEngine = new TurnEngine(this.gameStateManager);
        this.spellSystem = new SpellEffectSystem();
        this.aiEngines = {};
        this.gameLog = [];
        this.statistics = this.initializeStatistics();
        this.startTime = 0;
        this.combatSystem = null; // Will be initialized when we have a gameState
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
            
            this.log(0, 'setup', 'player1', 'Game initialized', {
                player1: 'player1',
                player2: 'player2'
            });

            // Main game loop
            let turns = 0;
            let winner: 'player1' | 'player2' | null = null;
            let reason: SimulationResult['reason'] = 'timeout';

            while (turns < config.maxTurns && !winner) {
                turns++;
                
                if (config.enableLogging) {
                    console.log(`--- Turn ${turns} (Player: ${gameState.phase.activePlayer}) ---`);
                }

                try {
                    // Execute turn
                    await this.executeTurn(gameState, config);
                    
                    // Check win conditions
                    const winCheck = this.checkWinConditions(gameState);
                    if (winCheck.winner) {
                        winner = winCheck.winner;
                        reason = winCheck.reason;
                        break;
                    }

                    // Check timeout
                    if (Date.now() - this.startTime > (config.timeoutMs || 60000)) {
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
        const playerId = gameState.phase.activePlayer;
        const aiEngine = this.aiEngines[playerId];

        if (!aiEngine) {
            throw new Error(`No AI engine found for player ${playerId}`);
        }

        // Start phase
        this.turnEngine.startTurn(gameState);
        this.log(gameState.turn, 'start', playerId, 'Turn started', {});

        // Main phase - AI makes decisions
        let actionsThisTurn = 0;
        const maxActionsPerTurn = 20; // Prevent infinite loops

        while (gameState.phase.type === 'main' && actionsThisTurn < maxActionsPerTurn) {
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
        playerId: 'player1' | 'player2', 
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

    private executePlayCard(gameState: GameState, playerId: 'player1' | 'player2', decision: any): { success: boolean; error?: string } {
        const card = this.findCardInHand(gameState, playerId, decision.cardId);
        if (!card) {
            return { success: false, error: 'Card not found in hand' };
        }

        if (!this.turnEngine.canPlayCard(gameState, playerId, card.name)) {
            return { success: false, error: 'Cannot play card' };
        }

        // Deduct mana
        const player = gameState.players[playerId];
        player.mana -= card.cost || 0;
        this.statistics.manaSpent[playerId] = (this.statistics.manaSpent[playerId] || 0) + (card.cost || 0);

        // Remove from hand
        const handSpells = player.hand.spells;
        const handSites = player.hand.sites;
        let cardRemoved = false;

        const spellIndex = handSpells.findIndex((c: Card) => c.name === card.name);
        if (spellIndex >= 0) {
            handSpells.splice(spellIndex, 1);
            cardRemoved = true;
        } else {
            const siteIndex = handSites.findIndex((c: Card) => c.name === card.name);
            if (siteIndex >= 0) {
                handSites.splice(siteIndex, 1);
                cardRemoved = true;
            }
        }

        if (!cardRemoved) {
            return { success: false, error: 'Could not remove card from hand' };
        }

        // Execute card effect based on type
        if (card.type === CardType.Minion) {
            this.playUnit(gameState, card, playerId, decision.targetPosition);
            this.statistics.unitsPlayed++;
        } else if (card.type === CardType.Magic || card.type === CardType.Artifact || card.type === CardType.Aura) {
            this.playSpell(gameState, card, playerId, decision.targets || []);
            this.statistics.spellsCast++;
        } else if (card.type === CardType.Site) {
            this.playSite(gameState, card, playerId, decision.targetPosition);
        }

        return { success: true };
    }

    private executeMoveUnit(gameState: GameState, playerId: 'player1' | 'player2', decision: any): { success: boolean; error?: string } {
        if (!this.turnEngine.canMoveUnit(gameState, decision.unitId)) {
            return { success: false, error: 'Cannot move unit' };
        }

        const unit = gameState.units.get(decision.unitId);
        if (!unit || unit.owner !== playerId) {
            return { success: false, error: 'Invalid unit' };
        }

        if (!this.turnEngine.canMoveToPosition(gameState, decision.unitId, decision.targetPosition)) {
            return { success: false, error: 'Cannot move to position' };
        }

        // Clear old position
        const oldPos = unit.position;
        const oldSquare = gameState.grid[oldPos.x][oldPos.y];
        oldSquare.units = oldSquare.units.filter(u => u.id !== decision.unitId);
        
        // Set new position
        unit.position = decision.targetPosition;
        const newSquare = gameState.grid[decision.targetPosition.x][decision.targetPosition.y];
        newSquare.units.push(unit);
        
        // Mark as used
        unit.canAct = false;

        return { success: true };
    }

    private executeAttack(gameState: GameState, playerId: 'player1' | 'player2', decision: any): { success: boolean; error?: string } {
        if (!this.combatSystem) {
            return { success: false, error: 'Combat system not initialized' };
        }

        const attacker = gameState.units.get(decision.unitId);
        if (!attacker) {
            return { success: false, error: 'Attacker unit not found' };
        }

        // Find a target if not specified
        let targetId = decision.targetUnitId;
        if (!targetId) {
            const validTargets = this.combatSystem.getValidTargets(decision.unitId);
            if (validTargets.length === 0) {
                return { success: false, error: 'No valid targets for attack' };
            }
            targetId = validTargets[0].id;
        }

        const combatResult = this.combatSystem.initiateCombat(decision.unitId, targetId);
        
        // Update statistics
        this.statistics.combatResolutions++;
        if (combatResult.success) {
            this.statistics.damageDealt[playerId] = (this.statistics.damageDealt[playerId] || 0) + combatResult.damage.defender;
        }
        
        // Mark attacker as used
        if (attacker) {
            attacker.isTapped = true;
        }

        return { success: combatResult.success };
    }

    private executeActivateAbility(gameState: GameState, playerId: 'player1' | 'player2', decision: any): { success: boolean; error?: string } {
        // Simplified ability activation - would need more sophisticated implementation
        return { success: true };
    }

    private playUnit(gameState: GameState, card: Card, playerId: 'player1' | 'player2', position: any): void {
        const unitId = `unit_${card.name}_${Date.now()}`;
        const unit = {
            id: unitId,
            card: card,
            owner: playerId,
            position: position,
            region: 'surface' as const,
            isTapped: false,
            damage: 0,
            summoning_sickness: true,
            artifacts: [],
            modifiers: []
        };

        gameState.units.set(unitId, unit);
        gameState.grid[position.x][position.y].units.push(unit);
    }

    private playSpell(gameState: GameState, card: Card, playerId: 'player1' | 'player2', targets: any[]): void {
        // Execute spell effects
        this.spellSystem.executeSpell(gameState, card, playerId, targets);
        
        // Move to graveyard/cemetery
        const player = gameState.players[playerId];
        player.cemetery.push(card);
    }

    private playSite(gameState: GameState, card: Card, playerId: 'player1' | 'player2', position: any): void {
        gameState.grid[position.x][position.y].site = card;
    }

    private initializeGame(config: SimulationConfig): GameState {
        if (!config.player1Deck || !config.player2Deck) {
            throw new Error('Both player decks are required for simulation');
        }
        
        const gameState = this.gameStateManager.initializeGame(config.player1Deck, config.player2Deck);
        
        // Initialize combat system now that we have gameState
        this.combatSystem = new CombatSystem(gameState);
        
        return gameState;
    }

    private setupAIEngines(gameState: GameState, config: SimulationConfig): void {
        this.aiEngines = {
            player1: new AIEngine(config.player1Strategy, this.turnEngine),
            player2: new AIEngine(config.player2Strategy, this.turnEngine)
        };
    }

    private checkWinConditions(gameState: GameState): { winner: 'player1' | 'player2' | null; reason: SimulationResult['reason'] } {
        // Check life totals
        if (gameState.players.player1.life <= 0) {
            return { winner: 'player2', reason: 'life' };
        }
        if (gameState.players.player2.life <= 0) {
            return { winner: 'player1', reason: 'life' };
        }

        // Check if player has no cards left
        const player1HandSize = gameState.players.player1.hand.spells.length + gameState.players.player1.hand.sites.length;
        const player2HandSize = gameState.players.player2.hand.spells.length + gameState.players.player2.hand.sites.length;

        if (gameState.players.player1.decks.spellbook.length === 0 && 
            gameState.players.player1.decks.atlas.length === 0 && 
            player1HandSize === 0) {
            return { winner: 'player2', reason: 'deck' };
        }
        if (gameState.players.player2.decks.spellbook.length === 0 && 
            gameState.players.player2.decks.atlas.length === 0 && 
            player2HandSize === 0) {
            return { winner: 'player1', reason: 'deck' };
        }

        return { winner: null, reason: 'timeout' };
    }

    private findCardInHand(gameState: GameState, playerId: 'player1' | 'player2', cardId: string): Card | null {
        const player = gameState.players[playerId];
        const allCards = [...player.hand.spells, ...player.hand.sites];
        return allCards.find((c: Card) => c.name === cardId) || null;
    }

    private initializeStatistics(): GameStatistics {
        return {
            totalActions: 0,
            spellsCast: 0,
            unitsPlayed: 0,
            combatResolutions: 0,
            damageDealt: { player1: 0, player2: 0 },
            cardsDrawn: { player1: 0, player2: 0 },
            manaSpent: { player1: 0, player2: 0 },
            averageDecisionTime: 0
        };
    }

    private updateDecisionTime(time: number): void {
        const current = this.statistics.averageDecisionTime;
        const total = this.statistics.totalActions;
        this.statistics.averageDecisionTime = total === 0 ? time : (current * total + time) / (total + 1);
    }

    private log(turn: number, phase: string, playerId: 'player1' | 'player2', action: string, details: any): void {
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
