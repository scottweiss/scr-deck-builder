import { GameState, Player, Card, Position, Unit, GameEvent } from './gameState';
import { TurnEngine } from './turnEngine';

export interface AIDecision {
    type: 'pass' | 'play_card' | 'move_unit' | 'attack' | 'activate_ability';
    cardId?: string;
    unitId?: string;
    targetPosition?: Position;
    targetUnitId?: string;
    priority: number;
    reasoning: string;
}

export interface AIStrategy {
    name: string;
    aggression: number; // 0-1, how likely to attack vs defend
    efficiency: number; // 0-1, how much to prioritize mana efficiency
    positioning: number; // 0-1, how much to prioritize board positioning
    cardAdvantage: number; // 0-1, how much to prioritize card draw/advantage
}

export class AIEngine {
    private strategy: AIStrategy;
    private turnEngine: TurnEngine;

    constructor(strategy: AIStrategy, turnEngine: TurnEngine) {
        this.strategy = strategy;
        this.turnEngine = turnEngine;
    }

    public async makeDecision(gameState: GameState, playerId: 'player1' | 'player2'): Promise<AIDecision> {
        const player = gameState.players[playerId];
        if (!player) {
            return { type: 'pass', priority: 0, reasoning: 'Invalid player' };
        }

        // Analyze current game state
        const analysis = this.analyzeGameState(gameState, playerId);
        
        // Generate possible actions
        const actions = this.generatePossibleActions(gameState, playerId);
        
        // Evaluate and rank actions
        const rankedActions = this.evaluateActions(actions, analysis, gameState);
        
        // Return the best action
        return rankedActions.length > 0 ? rankedActions[0] : 
            { type: 'pass', priority: 0, reasoning: 'No viable actions' };
    }

    private analyzeGameState(gameState: GameState, playerId: 'player1' | 'player2'): GameAnalysis {
        const player = gameState.players[playerId];
        const opponent = playerId === 'player1' ? gameState.players.player2 : gameState.players.player1;
        
        return {
            playerUnits: this.countUnits(gameState, playerId),
            opponentUnits: this.countUnits(gameState, opponent.id),
            playerLife: player.life,
            opponentLife: opponent.life,
            playerMana: player.mana,
            availableMana: this.calculateAvailableMana(player),
            handSize: player.hand.spells.length + player.hand.sites.length,
            boardControl: this.evaluateBoardControl(gameState, playerId),
            threatsOnBoard: this.identifyThreats(gameState, playerId),
            winConditionProgress: this.evaluateWinProgress(gameState, playerId)
        };
    }

    private generatePossibleActions(gameState: GameState, playerId: 'player1' | 'player2'): AIDecision[] {
        const actions: AIDecision[] = [];
        const player = gameState.players[playerId];

        // Generate card play actions for spells and sites
        const allCards = [...player.hand.spells, ...player.hand.sites];
        for (const card of allCards) {
            if (this.turnEngine.canPlayCard(gameState, playerId, card.name || '')) {
                const positions = this.getValidPlayPositions(gameState, card);
                for (const position of positions) {
                    actions.push({
                        type: 'play_card',
                        cardId: card.name,
                        targetPosition: position,
                        priority: 0,
                        reasoning: `Play ${card.name} at ${position.x},${position.y}`
                    });
                }
            }
        }

        // Generate unit movement actions
        gameState.units.forEach(unit => {
            if (unit.owner === playerId && (unit.canAct || !unit.isTapped)) {
                const movePositions = this.getValidMovePositions(gameState, unit);
                for (const position of movePositions) {
                    actions.push({
                        type: 'move_unit',
                        unitId: unit.id,
                        targetPosition: position,
                        priority: 0,
                        reasoning: `Move ${unit.name || unit.id} to ${position.x},${position.y}`
                    });
                }
            }
        });

        // Generate attack actions
        gameState.units.forEach(unit => {
            if (unit.owner === playerId && (unit.canAct || !unit.isTapped)) {
                const targets = this.getValidAttackTargets(gameState, unit);
                for (const target of targets) {
                    actions.push({
                        type: 'attack',
                        unitId: unit.id,
                        targetUnitId: target.id,
                        priority: 0,
                        reasoning: `Attack ${target.name || target.id} with ${unit.name || unit.id}`
                    });
                }
            }
        });

        return actions;
    }

    private evaluateActions(actions: AIDecision[], analysis: GameAnalysis, gameState: GameState): AIDecision[] {
        // Score each action based on strategy
        for (const action of actions) {
            action.priority = this.scoreAction(action, analysis, gameState);
        }

        // Sort by priority (highest first)
        return actions.sort((a, b) => b.priority - a.priority);
    }

    private scoreAction(action: AIDecision, analysis: GameAnalysis, gameState: GameState): number {
        let score = 0;

        switch (action.type) {
            case 'play_card':
                score = this.scoreCardPlay(action, analysis, gameState);
                break;
            case 'move_unit':
                score = this.scoreMoveAction(action, analysis, gameState);
                break;
            case 'attack':
                score = this.scoreAttackAction(action, analysis, gameState);
                break;
        }

        return Math.max(0, score);
    }

    private scoreCardPlay(action: AIDecision, analysis: GameAnalysis, gameState: GameState): number {
        if (!action.cardId) return 0;

        const card = this.findCard(gameState, action.cardId);
        if (!card) return 0;

        let score = 0;

        // Base value of the card
        score += card.cost * 2; // Playing higher cost cards is generally better

        // Mana efficiency consideration
        const manaCostRatio = card.cost / Math.max(1, analysis.availableMana);
        if (manaCostRatio <= this.strategy.efficiency) {
            score += 10;
        }

        // Card type specific scoring
        switch (card.type.toLowerCase()) {
            case 'unit':
            case 'minion':
                score += this.scoreUnitPlay(card, action.targetPosition!, gameState);
                break;
            case 'spell':
                score += this.scoreSpellPlay(card, gameState);
                break;
            case 'site':
                score += this.scoreSitePlay(card, action.targetPosition!, gameState);
                break;
        }

        // Strategic adjustments
        if (analysis.boardControl < 0.3) {
            // Need board presence
            if (card.type.toLowerCase() === 'unit' || card.type.toLowerCase() === 'minion') {
                score += 15;
            }
        }

        return score;
    }

    private scoreUnitPlay(card: Card, position: Position, gameState: GameState): number {
        let score = 0;

        // Base stats value
        score += (card.power || 0) * 3;
        score += (card.life || 0) * 2;

        // Positioning value
        const positionValue = this.evaluatePosition(position, gameState);
        score += positionValue * this.strategy.positioning * 10;

        // Synergy with existing units
        score += this.evaluateUnitSynergy(card, position, gameState) * 5;

        return score;
    }

    private scoreSpellPlay(card: Card, gameState: GameState): number {
        let score = 0;

        // Spell efficiency - immediate impact spells score higher when behind
        if (card.text?.toLowerCase().includes('damage')) {
            score += 8 * this.strategy.aggression;
        }

        if (card.text?.toLowerCase().includes('draw')) {
            score += 6 * this.strategy.cardAdvantage;
        }

        return score;
    }

    private scoreSitePlay(card: Card, position: Position, gameState: GameState): number {
        let score = 0;

        // Sites provide ongoing value
        score += 5;

        // Position matters for sites
        const positionValue = this.evaluatePosition(position, gameState);
        score += positionValue * 8;

        return score;
    }

    private scoreMoveAction(action: AIDecision, analysis: GameAnalysis, gameState: GameState): number {
        if (!action.unitId || !action.targetPosition) return 0;

        const unit = gameState.units.get(action.unitId);
        if (!unit) return 0;

        let score = 0;

        // Moving towards enemy avatar/units
        const distanceToEnemies = this.calculateDistanceToEnemies(action.targetPosition, gameState, unit.owner);
        if (this.strategy.aggression > 0.5) {
            score += Math.max(0, 10 - distanceToEnemies) * this.strategy.aggression;
        }

        // Moving to better defensive positions
        const defensiveValue = this.evaluateDefensivePosition(action.targetPosition, gameState, unit.owner);
        score += defensiveValue * (1 - this.strategy.aggression) * 5;

        // Avoid moving into danger
        const dangerLevel = this.evaluatePositionDanger(action.targetPosition, gameState, unit.owner);
        score -= dangerLevel * 8;

        return score;
    }

    private scoreAttackAction(action: AIDecision, analysis: GameAnalysis, gameState: GameState): number {
        if (!action.unitId || !action.targetUnitId) return 0;

        const attacker = gameState.units.get(action.unitId);
        const target = gameState.units.get(action.targetUnitId);
        
        if (!attacker || !target) return 0;

        let score = 0;

        // Favorable trades
        if ((attacker.power || 0) >= (target.life || 0)) {
            score += 15; // Can destroy target
            
            if ((target.power || 0) < (attacker.life || 0)) {
                score += 10; // Favorable trade
            }
        }

        // Aggression factor
        score += 5 * this.strategy.aggression;

        // Target priority (avatars are high priority)
        if (target.id.includes('avatar')) {
            score += 20;
        }

        // Prevent enemy from attacking
        if (target.canAct || !target.isTapped) {
            score += 8;
        }

        return score;
    }

    // Helper methods for evaluation
    private countUnits(gameState: GameState, playerId: 'player1' | 'player2'): number {
        let count = 0;
        gameState.units.forEach(unit => {
            if (unit.owner === playerId) count++;
        });
        return count;
    }

    private calculateAvailableMana(player: Player): number {
        // Count mana from sites and base mana
        let totalMana = player.mana;
        // Add logic to count site-generated mana if needed
        return totalMana;
    }

    private evaluateBoardControl(gameState: GameState, playerId: 'player1' | 'player2'): number {
        const playerUnits = this.countUnits(gameState, playerId);
        const totalUnits = gameState.units.size;
        
        return totalUnits > 0 ? playerUnits / totalUnits : 0.5;
    }

    private identifyThreats(gameState: GameState, playerId: 'player1' | 'player2'): Unit[] {
        const threats: Unit[] = [];
        gameState.units.forEach(unit => {
            if (unit.owner !== playerId && (unit.power || 0) > 2) {
                threats.push(unit);
            }
        });
        return threats;
    }

    private evaluateWinProgress(gameState: GameState, playerId: 'player1' | 'player2'): number {
        const opponentId = playerId === 'player1' ? 'player2' : 'player1';
        const opponent = gameState.players[opponentId];
        if (!opponent) return 0;

        // Simple win progress based on opponent's life
        return 1 - (opponent.life / 25); // Assuming 25 starting life
    }

    private getValidPlayPositions(gameState: GameState, card: Card): Position[] {
        const positions: Position[] = [];
        
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 4; y++) {
                const position = { x, y };
                if (this.turnEngine.canPlaceAt(gameState, card, position)) {
                    positions.push(position);
                }
            }
        }
        
        return positions;
    }

    private getValidMovePositions(gameState: GameState, unit: Unit): Position[] {
        const positions: Position[] = [];
        const currentPos = unit.position;
        
        // Check adjacent positions (basic movement)
        const directions = [
            { x: 0, y: 1 }, { x: 0, y: -1 },
            { x: 1, y: 0 }, { x: -1, y: 0 }
        ];
        
        for (const dir of directions) {
            const newPos = { 
                x: currentPos.x + dir.x, 
                y: currentPos.y + dir.y 
            };
            
            if (this.isValidPosition(newPos) && this.turnEngine.canMoveToPosition(gameState, unit.id, newPos)) {
                positions.push(newPos);
            }
        }
        
        return positions;
    }

    private getValidAttackTargets(gameState: GameState, unit: Unit): Unit[] {
        const targets: Unit[] = [];
        
        for (const target of Object.values(gameState.units)) {
            if (target.owner !== unit.owner && this.canAttack(unit, target)) {
                targets.push(target);
            }
        }
        
        return targets;
    }

    private canAttack(attacker: Unit, target: Unit): boolean {
        // Basic adjacency check for melee attacks
        const distance = Math.abs(attacker.position.x - target.position.x) + 
                        Math.abs(attacker.position.y - target.position.y);
        return distance <= 1;
    }

    private findCard(gameState: GameState, cardId: string): Card | null {
        for (const player of Object.values(gameState.players)) {
            // Search in spells
            const spellCard = player.hand.spells.find((c: Card) => c.name === cardId);
            if (spellCard) return spellCard;
            
            // Search in sites
            const siteCard = player.hand.sites.find((c: Card) => c.name === cardId);
            if (siteCard) return siteCard;
        }
        return null;
    }

    private evaluatePosition(position: Position, gameState: GameState): number {
        let value = 0;
        
        // Center positions are generally better
        const centerDistance = Math.abs(position.x - 2) + Math.abs(position.y - 1.5);
        value += Math.max(0, 5 - centerDistance);
        
        // Near friendly units is good for support
        let friendlyAdjacent = 0;
        const directions = [
            { x: 0, y: 1 }, { x: 0, y: -1 },
            { x: 1, y: 0 }, { x: -1, y: 0 }
        ];
        
        for (const dir of directions) {
            const adjPos = { x: position.x + dir.x, y: position.y + dir.y };
            const unitAt = this.getUnitAt(gameState, adjPos);
            if (unitAt) {
                friendlyAdjacent++;
            }
        }
        
        value += friendlyAdjacent * 2;
        
        return value;
    }

    private evaluateUnitSynergy(card: Card, position: Position, gameState: GameState): number {
        // Simple synergy evaluation based on card elements and nearby units
        let synergy = 0;
        
        const nearbyUnits = this.getNearbyUnits(gameState, position, 2);
        for (const unit of nearbyUnits) {
            // Same element synergy
            if (card.elements && unit.elements) {
                const commonElements = card.elements.filter(e => unit.elements?.includes(e));
                synergy += commonElements.length;
            }
        }
        
        return synergy;
    }

    private calculateDistanceToEnemies(position: Position, gameState: GameState, playerId: 'player1' | 'player2'): number {
        let minDistance = Infinity;
        
        gameState.units.forEach(unit => {
            if (unit.owner !== playerId) {
                const distance = Math.abs(position.x - unit.position.x) + 
                               Math.abs(position.y - unit.position.y);
                minDistance = Math.min(minDistance, distance);
            }
        });
        
        return minDistance === Infinity ? 10 : minDistance;
    }

    private evaluateDefensivePosition(position: Position, gameState: GameState, playerId: 'player1' | 'player2'): number {
        // Positions near friendly avatar or in corners are more defensive
        let defensiveValue = 0;
        
        let avatar: Unit | undefined;
        gameState.units.forEach(unit => {
            if (unit.owner === playerId && unit.id.includes('avatar')) {
                avatar = unit;
            }
        });
        
        if (avatar) {
            const distanceToAvatar = Math.abs(position.x - avatar.position.x) + 
                                   Math.abs(position.y - avatar.position.y);
            defensiveValue += Math.max(0, 5 - distanceToAvatar);
        }
        
        return defensiveValue;
    }

    private evaluatePositionDanger(position: Position, gameState: GameState, playerId: 'player1' | 'player2'): number {
        let danger = 0;
        
        gameState.units.forEach(unit => {
            if (unit.owner !== playerId) {
                const distance = Math.abs(position.x - unit.position.x) + 
                               Math.abs(position.y - unit.position.y);
                if (distance <= 1) {
                    danger += (unit.power || 0);
                }
            }
        });
        
        return danger;
    }

    private getNearbyUnits(gameState: GameState, position: Position, radius: number): Unit[] {
        const nearbyUnits: Unit[] = [];
        gameState.units.forEach(unit => {
            const distance = Math.abs(position.x - unit.position.x) + 
                           Math.abs(position.y - unit.position.y);
            if (distance <= radius) {
                nearbyUnits.push(unit);
            }
        });
        return nearbyUnits;
    }

    private getUnitAt(gameState: GameState, position: Position): Unit | null {
        let unitAtPosition: Unit | null = null;
        gameState.units.forEach(unit => {
            if (unit.position.x === position.x && unit.position.y === position.y) {
                unitAtPosition = unit;
            }
        });
        return unitAtPosition;
    }

    private isValidPosition(position: Position): boolean {
        return position.x >= 0 && position.x < 5 && position.y >= 0 && position.y < 4;
    }

    private getOpponentId(playerId: 'player1' | 'player2'): 'player1' | 'player2' {
        return playerId === 'player1' ? 'player2' : 'player1';
    }
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

// Predefined AI strategies
export const AI_STRATEGIES: { [key: string]: AIStrategy } = {
    AGGRESSIVE: {
        name: 'Aggressive',
        aggression: 0.8,
        efficiency: 0.6,
        positioning: 0.4,
        cardAdvantage: 0.3
    },
    CONTROL: {
        name: 'Control',
        aggression: 0.3,
        efficiency: 0.8,
        positioning: 0.7,
        cardAdvantage: 0.9
    },
    MIDRANGE: {
        name: 'Midrange',
        aggression: 0.5,
        efficiency: 0.7,
        positioning: 0.6,
        cardAdvantage: 0.6
    },
    DEFENSIVE: {
        name: 'Defensive',
        aggression: 0.2,
        efficiency: 0.6,
        positioning: 0.9,
        cardAdvantage: 0.7
    }
};
