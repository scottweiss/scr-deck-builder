import { GameState, Player, Card, Position, Unit, GameEvent } from './gameState';
import { TurnEngine } from './turnEngine';
import { AIStrategy as StrategyInterface, BaseAIStrategy } from '../ai/aiStrategy';
import { ActionEvaluator } from '../ai/actionEvaluator';
import { DifficultyManager, AIDifficulty } from '../ai/difficultyManager';

export interface AIDecision {
    type: 'pass' | 'play_card' | 'move_unit' | 'attack' | 'activate_ability';
    cardId?: string;
    unitId?: string;
    targetPosition?: Position;
    targetUnitId?: string;
    priority: number;
    reasoning: string;
}

export class AIEngine {
    private strategy: StrategyInterface;
    private turnEngine: TurnEngine;
    private difficultyManager: DifficultyManager;

    constructor(strategy: StrategyInterface, turnEngine: TurnEngine, difficulty: AIDifficulty = 'medium') {
        this.strategy = strategy;
        this.turnEngine = turnEngine;
        this.difficultyManager = new DifficultyManager(difficulty);
    }

    public async makeDecision(gameState: GameState, playerId: 'player1' | 'player2'): Promise<AIDecision> {
        const player = gameState.players[playerId];
        if (!player) {
            return { type: 'pass', priority: 0, reasoning: 'Invalid player' };
        }

        // Use pluggable strategy for evaluation and action generation
        const actions = this.strategy.generateActions(gameState, player);
        const ranked = ActionEvaluator.rankActions(actions, gameState, player);
        
        // Convert GameAction to AIDecision
        let selectedAction = ranked[0];
        
        // Optionally add randomness based on difficulty
        const randomness = this.difficultyManager.getActionSelectionRandomness();
        if (randomness > 0 && ranked.length > 1 && Math.random() < randomness) {
            const idx = Math.floor(Math.random() * ranked.length);
            selectedAction = ranked[idx];
        }
        
        if (!selectedAction) {
            return { type: 'pass', priority: 0, reasoning: 'No viable actions' };
        }
        
        // Convert GameAction to AIDecision
        const decision: AIDecision = {
            type: this.convertActionTypeToDecisionType(selectedAction.type),
            cardId: selectedAction.cardId,
            unitId: selectedAction.unitId,
            targetPosition: selectedAction.targetPosition,
            targetUnitId: selectedAction.targetUnitId,
            priority: selectedAction.priority || 1,
            reasoning: selectedAction.reasoning || this.generateReasoning(selectedAction, gameState, player)
        };
        
        return decision;
    }
    
    private convertActionTypeToDecisionType(actionType: string): 'pass' | 'play_card' | 'move_unit' | 'attack' | 'activate_ability' {
        switch (actionType) {
            case 'PLAY_CARD': return 'play_card';
            case 'MOVE': return 'move_unit';
            case 'ATTACK': return 'attack';
            case 'ACTIVATE_ABILITY': return 'activate_ability';
            case 'PASS':
            default: return 'pass';
        }
    }
    
    private generateReasoning(action: any, gameState: GameState, player: Player): string {
        switch (action.type) {
            case 'PLAY_CARD':
                return `Playing card to advance board position`;
            case 'MOVE':
                return `Moving unit for strategic advantage`;
            case 'ATTACK':
                return `Attacking to apply pressure`;
            case 'ACTIVATE_ABILITY':
                return `Using ability for tactical benefit`;
            case 'PASS':
            default:
                return `Passing to opponent`;
        }
    }

    // ...existing methods...
}

interface GameAnalysis {
    playerUnits: number;
    opponentUnits: number;
    playerLife: number;
    opponentLife: number;
    playerMana: number;
    availableMana: number;
    handSize: number;
    boardControl: number;
    threatsOnBoard: Unit[];
    winConditionProgress: number;
}
