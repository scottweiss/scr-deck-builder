/**
 * Game State Evaluator for AI decision making
 * Provides comprehensive evaluation metrics for AI strategies
 */

import { GameState, Player, Unit, Position } from '../core/gameState';
import { Card } from '../../../types/Card';

export interface GameEvaluation {
  boardControl: number;        // 0-100, control of the board
  materialAdvantage: number;   // Difference in unit values
  handAdvantage: number;       // Card advantage
  lifeAdvantage: number;       // Life total difference
  manaAdvantage: number;       // Available mana difference
  positionalAdvantage: number; // Positioning quality
  threatLevel: number;         // Immediate threats faced
  winProbability: number;      // 0-1, estimated win chance
  urgency: number;             // 0-1, need for immediate action
}

export class GameStateEvaluator {
  
  /**
   * Comprehensive evaluation of game state from a player's perspective
   */
  static evaluateGameState(gameState: GameState, playerId: 'player1' | 'player2'): GameEvaluation {
    const player = gameState.players[playerId];
    const opponent = gameState.players[playerId === 'player1' ? 'player2' : 'player1'];
    
    const boardControl = this.evaluateBoardControl(gameState, playerId);
    const materialAdvantage = this.evaluateMaterialAdvantage(gameState, playerId);
    const handAdvantage = this.evaluateHandAdvantage(player, opponent);
    const lifeAdvantage = this.evaluateLifeAdvantage(player, opponent);
    const manaAdvantage = this.evaluateManaAdvantage(player, opponent);
    const positionalAdvantage = this.evaluatePositionalAdvantage(gameState, playerId);
    const threatLevel = this.evaluateThreatLevel(gameState, playerId);
    
    // Calculate overall win probability
    const winProbability = this.calculateWinProbability({
      boardControl,
      materialAdvantage,
      handAdvantage,
      lifeAdvantage,
      manaAdvantage,
      positionalAdvantage,
      threatLevel
    });
    
    const urgency = this.calculateUrgency(gameState, playerId, threatLevel);
    
    return {
      boardControl,
      materialAdvantage,
      handAdvantage,
      lifeAdvantage,
      manaAdvantage,
      positionalAdvantage,
      threatLevel,
      winProbability,
      urgency
    };
  }
  
  /**
   * Evaluate board control (-1 to 1, where 1 = full control, -1 = opponent has full control)
   */
  private static evaluateBoardControl(gameState: GameState, playerId: 'player1' | 'player2'): number {
    const myUnits = Array.from(gameState.units?.values() || []).filter(u => u.owner === playerId);
    const oppUnits = Array.from(gameState.units?.values() || []).filter(u => u.owner !== playerId);
    
    const myStrength = myUnits.reduce((sum: number, unit: Unit) => sum + (unit.power || unit.card.power || 1), 0);
    const oppStrength = oppUnits.reduce((sum: number, unit: Unit) => sum + (unit.power || unit.card.power || 1), 0);
    
    if (myStrength + oppStrength === 0) return 0;
    
    // Convert to -1 to 1 scale: (myStrength - oppStrength) / (myStrength + oppStrength)
    return (myStrength - oppStrength) / (myStrength + oppStrength);
  }
  
  /**
   * Evaluate material advantage (difference in unit values)
   */
  private static evaluateMaterialAdvantage(gameState: GameState, playerId: 'player1' | 'player2'): number {
    const myUnits = Array.from(gameState.units?.values() || []).filter(u => u.owner === playerId);
    const oppUnits = Array.from(gameState.units?.values() || []).filter(u => u.owner !== playerId);
    
    const myValue = myUnits.reduce((sum: number, unit: Unit) => sum + this.getUnitValue(unit), 0);
    const oppValue = oppUnits.reduce((sum: number, unit: Unit) => sum + this.getUnitValue(unit), 0);
    
    return myValue - oppValue;
  }
  
  /**
   * Evaluate hand advantage
   */
  private static evaluateHandAdvantage(player: Player, opponent: Player): number {
    const myHandSize = (player.hand?.spells?.length || 0) + (player.hand?.sites?.length || 0);
    const oppHandSize = (opponent.hand?.spells?.length || 0) + (opponent.hand?.sites?.length || 0);
    
    return myHandSize - oppHandSize;
  }
  
  /**
   * Evaluate life advantage
   */
  private static evaluateLifeAdvantage(player: Player, opponent: Player): number {
    return (player.life || 20) - (opponent.life || 20);
  }
  
  /**
   * Evaluate mana advantage
   */
  private static evaluateManaAdvantage(player: Player, opponent: Player): number {
    return (player.mana || 0) - (opponent.mana || 0);
  }
  
  /**
   * Evaluate positional advantage
   */
  private static evaluatePositionalAdvantage(gameState: GameState, playerId: 'player1' | 'player2'): number {
    // Simple implementation: units closer to opponent's side
    const myUnits = Array.from(gameState.units?.values() || []).filter(u => u.owner === playerId);
    
    if (myUnits.length === 0) return 50;
    
    const avgPosition = myUnits.reduce((sum: number, unit: Unit) => sum + unit.position.y, 0) / myUnits.length;
    
    // For player1, lower Y is better (closer to opponent)
    // For player2, higher Y is better
    if (playerId === 'player1') {
      return Math.max(0, 4 - (avgPosition || 2)) * 25;
    } else {
      return Math.max(0, (avgPosition || 2)) * 25;
    }
  }
  
  /**
   * Evaluate threat level (0-100, higher = more threatened)
   */
  private static evaluateThreatLevel(gameState: GameState, playerId: 'player1' | 'player2'): number {
    const oppUnits = Array.from(gameState.units?.values() || []).filter(u => u.owner !== playerId);
    const player = gameState.players[playerId];
    
    // Calculate immediate threats
    let threatLevel = 0;
    
    // Life-based threats
    if (player.life <= 5) threatLevel += 50;
    else if (player.life <= 10) threatLevel += 25;
    
    // Unit-based threats
    const oppTotalPower = oppUnits.reduce((sum: number, unit: Unit) => sum + (unit.power || unit.card.power || 1), 0);
    if (oppTotalPower >= player.life) threatLevel += 30;
    
    return Math.min(100, threatLevel);
  }
  
  /**
   * Calculate overall win probability (0-1)
   */
  private static calculateWinProbability(metrics: Partial<GameEvaluation>): number {
    const weights = {
      boardControl: 0.25,
      materialAdvantage: 0.2,
      handAdvantage: 0.15,
      lifeAdvantage: 0.2,
      manaAdvantage: 0.1,
      positionalAdvantage: 0.1
    };
    
    let score = 0.5; // Base 50% chance
    
    // boardControl is now -1 to 1, so we can use it directly
    score += (metrics.boardControl || 0) * weights.boardControl;
    score += Math.tanh((metrics.materialAdvantage || 0) / 10) * weights.materialAdvantage;
    score += Math.tanh((metrics.handAdvantage || 0) / 3) * weights.handAdvantage;
    score += Math.tanh((metrics.lifeAdvantage || 0) / 20) * weights.lifeAdvantage;
    score += Math.tanh((metrics.manaAdvantage || 0) / 5) * weights.manaAdvantage;
    score += (metrics.positionalAdvantage || 50 - 50) * weights.positionalAdvantage / 100;
    
    // Adjust for threat level
    score -= (metrics.threatLevel || 0) * 0.3 / 100;
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Calculate urgency level (0-1)
   */
  private static calculateUrgency(gameState: GameState, playerId: 'player1' | 'player2', threatLevel: number): number {
    const player = gameState.players[playerId];
    
    let urgency = threatLevel / 100;
    
    // Increase urgency if low on life
    if (player.life <= 3) urgency = Math.max(urgency, 0.9);
    else if (player.life <= 7) urgency = Math.max(urgency, 0.6);
    
    // Increase urgency if opponent has overwhelming board
    const oppUnits = Array.from(gameState.units?.values() || []).filter(u => u.owner !== playerId);
    const myUnits = Array.from(gameState.units?.values() || []).filter(u => u.owner === playerId);
    
    if (oppUnits.length > myUnits.length * 2) {
      urgency = Math.max(urgency, 0.7);
    }
    
    return Math.min(1, urgency);
  }
  
  /**
   * Get the strategic value of a unit
   */
  private static getUnitValue(unit: Unit): number {
    // Base value from power and life
    const power = unit.power || unit.card.power || 1;
    const life = unit.life || unit.card.life || 1;
    
    let value = power + life;
    
    // Adjust for keywords and abilities
    if (unit.card.keywords?.includes('Flying')) value += 1;
    if (unit.card.keywords?.includes('Stealth')) value += 1;
    if (unit.card.keywords?.includes('Charge')) value += 0.5;
    
    // Adjust for damage taken
    value -= unit.damage || 0;
    
    return Math.max(0, value);
  }
}
