/**
 * Integration module to connect the match simulation system 
 * with the existing deck building system
 */

import { Card } from '../../../types';
import { MatchSimulator, SimulationConfig as MatchSimulatorConfig, SimulationResult as MatchSimulatorResult, GameLogEntry } from '../core/matchSimulator';
import { AI_STRATEGIES, AIStrategy } from '../core/aiEngine';

export interface DeckSimulationConfig {
  deck: Card[];
  strategy: AIStrategy;
  testRuns: number;
  opponentDeck?: Card[];
  opponentDecks?: Card[][];
  opponentStrategy?: AIStrategy;
  enableLogging?: boolean;
  maxTurns?: number;
  timeoutMs?: number;
}

export interface DeckPerformanceReport {
  winRate: number;
  averageTurns: number;
  consistency: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  matchupResults: MatchupResult[];
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  deckOptimization: {
    cardChanges: CardChange[];
    elementBalance: ElementAnalysis;
    curveAnalysis: CurveAnalysis;
  };
}

export interface BatchResult {
  player1WinRate: number;
  player2WinRate: number;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  ties: number;
  totalGames: number;
  averageTurns: number;
  averageGameDuration: number;
  gameResults: SimulationResult[];
  winReasons: Record<string, number>;
}

export interface OptimizationResult {
  bestDeck: Card[];
  improvements: string[];
  winRate: number;
  comparisonResults: Record<string, number>;
  results: DeckPerformanceReport[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface MatchupResult {
  deckType: string;
  winRate: number;
  sampleSize: number;
  gamesPlayed: number;
}

export interface CardChange {
  remove?: Card[];
  add?: Card[];
  card: string;
  action: string;
  reason: string;
}

export interface ElementAnalysis {
  distribution: Record<string, number>;
  recommendations: string[];
}

export interface CurveAnalysis {
  curve: number[];
  ideal: number[];
  recommendations: string[];
}

export interface SimulationResult {
  winner: 'player1' | 'player2' | 'draw' | string | null;
  turns: number;
  gameLog: GameEvent[];
  reason: string;
  duration: number;
  statistics: GameStatistics;
}

export interface GameStatistics {
  totalActions: number;
  combatResolutions: number;
  spellsCast: number;
  unitsPlayed: number;
}

export interface SimulationConfig {
  player1Deck: Card[];
  player2Deck: Card[];
  player1Strategy: AIStrategy;
  player2Strategy: AIStrategy;
  maxTurns?: number;
  enableLogging?: boolean;
  randomSeed?: number;
}

export interface GameEvent {
  turn: number;
  phase: string;
  player: number;
  playerId: string;
  action: string;
  details?: any;
}

/**
 * Main integration class for simulation systems
 */
export class SimulationIntegration {
  private simulator: MatchSimulator;

  constructor() {
    this.simulator = new MatchSimulator();
  }

  /**
   * Analyze deck performance against various opponents
   */
  public async analyzeDeckPerformance(config: DeckSimulationConfig): Promise<DeckPerformanceReport> {
    const matchResults: SimulationResult[] = [];
    
    // Handle multiple opponent decks for meta analysis
    if (config.opponentDecks && config.opponentDecks.length > 0) {
      const gamesPerDeck = Math.floor(config.testRuns / config.opponentDecks.length);
      
      for (const opponentDeck of config.opponentDecks) {
        const results = await this.batchSimulate(
          config.deck,
          opponentDeck,
          gamesPerDeck,
          config.strategy,
          config.opponentStrategy || AI_STRATEGIES.MIDRANGE
        );
        matchResults.push(...results.gameResults);
      }
    } else if (config.opponentDeck) {
      // Single opponent deck
      const results = await this.batchSimulate(
        config.deck,
        config.opponentDeck,
        config.testRuns,
        config.strategy,
        config.opponentStrategy || AI_STRATEGIES.MIDRANGE
      );
      matchResults.push(...results.gameResults);
    } else {
      // Test against meta decks
      const metaDecks = this.getMetaDecks();
      for (const metaDeck of metaDecks) {
        const results = await this.batchSimulate(
          config.deck,
          metaDeck.deck,
          Math.floor(config.testRuns / metaDecks.length),
          config.strategy,
          metaDeck.strategy
        );
        matchResults.push(...results.gameResults);
      }
    }

    return this.generatePerformanceReport(config.deck, matchResults);
  }

  /**
   * Run multiple simulations between two decks
   */
  public async batchSimulate(
    deck1: Card[],
    deck2: Card[],
    runs: number,
    player1Strategy: AIStrategy = AI_STRATEGIES.MIDRANGE,
    player2Strategy: AIStrategy = AI_STRATEGIES.MIDRANGE
  ): Promise<BatchResult> {
    const results: SimulationResult[] = [];
    
    for (let i = 0; i < runs; i++) {
      const matchResult = await this.simulator.simulateMatch({
        player1Deck: this.convertToPlayerDeck(deck1),
        player2Deck: this.convertToPlayerDeck(deck2),
        player1Strategy,
        player2Strategy,
        enableLogging: false,
        maxTurns: 30,
        timeoutMs: 60000
      });
      
      // Convert MatchSimulator result to our SimulationResult format
      const result: SimulationResult = {
        winner: matchResult.winner,
        turns: matchResult.turns,
        gameLog: this.convertGameLog(matchResult.gameLog),
        reason: matchResult.reason,
        duration: matchResult.duration,
        statistics: matchResult.statistics
      };
      
      results.push(result);
    }
    
    // Calculate statistics
    const player1Wins = results.filter(r => r.winner === 'player1').length;
    const player2Wins = results.filter(r => r.winner === 'player2').length;
    const draws = results.filter(r => r.winner === 'draw').length;
    
    const totalTurns = results.reduce((sum, r) => sum + r.turns, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      player1WinRate: player1Wins / runs,
      player2WinRate: player2Wins / runs,
      player1Wins,
      player2Wins,
      draws: draws / runs,
      ties: draws,
      totalGames: runs,
      averageTurns: totalTurns / runs,
      averageGameDuration: totalDuration / runs,
      gameResults: results,
      winReasons: this.calculateWinReasons(results)
    };
  }

  /**
   * Test deck variations to find optimal build
   */
  public async optimizeDeck(
    baseDeck: Card[],
    variations: Card[][],
    strategy: AIStrategy = AI_STRATEGIES.MIDRANGE,
    gamesPerVariation: number = 30
  ): Promise<OptimizationResult> {
    const results: DeckPerformanceReport[] = [];
    let bestDeck = baseDeck;
    let bestWinRate = 0;
    
    // Test base deck
    const baseResult = await this.analyzeDeckPerformance({
      deck: baseDeck,
      strategy,
      testRuns: gamesPerVariation
    });
    
    results.push(baseResult);
    bestWinRate = baseResult.winRate;
    
    // Test variations
    for (const variation of variations) {
      const variationResult = await this.analyzeDeckPerformance({
        deck: variation,
        strategy,
        testRuns: gamesPerVariation
      });
      
      results.push(variationResult);
      
      if (variationResult.winRate > bestWinRate) {
        bestWinRate = variationResult.winRate;
        bestDeck = variation;
      }
    }
    
    const improvements = this.generateImprovementNotes(baseDeck, bestDeck, results);
    
    return {
      bestDeck,
      improvements,
      winRate: bestWinRate,
      comparisonResults: this.createComparisonResults(results),
      results
    };
  }

  /**
   * Simulate a single match with detailed logging
   */
  public async simulateMatch(
    deck1: Card[],
    deck2: Card[],
    player1Strategy: AIStrategy,
    player2Strategy: AIStrategy,
    options: { enableLogging?: boolean; maxTurns?: number } = {}
  ): Promise<SimulationResult> {
    const matchResult = await this.simulator.simulateMatch({
      player1Deck: this.convertToPlayerDeck(deck1),
      player2Deck: this.convertToPlayerDeck(deck2),
      player1Strategy,
      player2Strategy,
      enableLogging: options.enableLogging || false,
      maxTurns: options.maxTurns || 30,
      timeoutMs: 60000
    });

    return {
      winner: matchResult.winner,
      turns: matchResult.turns,
      gameLog: this.convertGameLog(matchResult.gameLog),
      reason: matchResult.reason,
      duration: matchResult.duration,
      statistics: matchResult.statistics
    };
  }

  /**
   * Validate deck composition
   */
  public validateDeck(deck: Card[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Check deck size
    if (deck.length < 40) {
      errors.push(`Deck too small: ${deck.length}. Deck must contain at least 40 cards.`);
    } else if (deck.length > 60) {
      warnings.push(`Large deck: ${deck.length} cards. Consider reducing for consistency.`);
    }
    
    // Check for avatar
    const avatars = deck.filter(card => card.type === 'Avatar' || card.extCardType === 'Avatar');
    if (avatars.length === 0) {
      errors.push('Deck must contain an avatar card.');
    } else if (avatars.length > 1) {
      errors.push('Deck can only contain one avatar card.');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  // Helper methods
  private convertToPlayerDeck(cards: Card[]): { avatar: Card; spells: Card[]; sites: Card[] } {
    const avatar = cards.find(card => card.type === 'Avatar' || card.extCardType === 'Avatar');
    const spells = cards.filter(card => card.type === 'Magic' || card.extCardType === 'Magic');
    const sites = cards.filter(card => card.type === 'Site' || card.extCardType === 'Site');
    
    if (!avatar) {
      throw new Error('Deck must contain an avatar');
    }
    
    return {
      avatar,
      spells,
      sites
    };
  }

  private convertGameLog(gameLog: GameLogEntry[]): GameEvent[] {
    return gameLog.map(entry => ({
      turn: entry.turn,
      phase: entry.phase,
      player: entry.playerId === 'player1' ? 1 : 2,
      playerId: entry.playerId,
      action: entry.action,
      details: entry.details
    }));
  }

  private calculateWinReasons(results: SimulationResult[]): Record<string, number> {
    const reasons: Record<string, number> = {};
    results.forEach(result => {
      const reason = result.reason || 'Unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    return reasons;
  }

  private createComparisonResults(results: DeckPerformanceReport[]): Record<string, number> {
    const comparison: Record<string, number> = {};
    results.forEach((result, index) => {
      const key = index === 0 ? 'base' : `variation_${index - 1}`;
      comparison[key] = result.winRate;
    });
    return comparison;
  }

  private generatePerformanceReport(deck: Card[], results: SimulationResult[]): DeckPerformanceReport {
    const wins = results.filter(r => r.winner === 'player1').length;
    const winRate = wins / results.length;
    const avgTurns = results.reduce((sum, r) => sum + r.turns, 0) / results.length;

    return {
      winRate,
      averageTurns: avgTurns,
      consistency: { 
        score: this.calculateConsistency(results), 
        issues: this.findConsistencyIssues(deck), 
        recommendations: this.generateConsistencyRecommendations(deck) 
      },
      matchupResults: this.generateMatchupResults(results),
      strengthsAndWeaknesses: { 
        strengths: this.identifyStrengths(deck, results), 
        weaknesses: this.identifyWeaknesses(deck, results), 
        recommendations: this.generateStrengthWeaknessRecommendations(deck, results) 
      },
      deckOptimization: { 
        cardChanges: this.suggestCardChanges(deck, results), 
        elementBalance: { distribution: this.analyzeElementBalance(deck), recommendations: [] },
        curveAnalysis: { curve: this.analyzeManaCurve(deck).curve, ideal: [], recommendations: [] }
      }
    };
  }

  // Placeholder implementations for helper methods
  private calculateConsistency(results: SimulationResult[]): number { return 0.8; }
  private findConsistencyIssues(deck: Card[]): string[] { return []; }
  private generateConsistencyRecommendations(deck: Card[]): string[] { return []; }
  private generateMatchupResults(results: SimulationResult[]): MatchupResult[] { return []; }
  private identifyStrengths(deck: Card[], results: SimulationResult[]): string[] { return []; }
  private identifyWeaknesses(deck: Card[], results: SimulationResult[]): string[] { return []; }
  private generateStrengthWeaknessRecommendations(deck: Card[], results: SimulationResult[]): string[] { return []; }
  private suggestCardChanges(deck: Card[], results: SimulationResult[]): CardChange[] { return []; }
  private analyzeElementBalance(deck: Card[]): Record<string, number> { return {}; }
  
  private getMetaDecks(): { deck: Card[], strategy: AIStrategy, name: string }[] {
    // Would return a collection of meta decks
    return []; // Placeholder
  }
  
  private generateImprovementNotes(baseDeck: Card[], bestDeck: Card[], results: DeckPerformanceReport[]): string[] {
    // Implementation would analyze differences and suggest improvements
    const improvements: string[] = [];
    
    if (results.length > 1) {
      const baseWinRate = results[0].winRate;
      const bestWinRate = Math.max(...results.map(r => r.winRate));
      
      if (bestWinRate > baseWinRate) {
        improvements.push(`Found deck variation with ${((bestWinRate - baseWinRate) * 100).toFixed(1)}% higher win rate`);
      }
    }
    
    return improvements;
  }
  
  private countElements(deck: Card[]): Record<string, number> {
    // Implementation would count elements in deck
    return {}; // Placeholder
  }
  
  private calculateTotalThresholds(deck: Card[]): Record<string, number> {
    // Implementation would calculate element thresholds
    return {}; // Placeholder
  }
  
  private analyzeManaCurve(deck: Card[]): { curve: number[], issues: string[] } {
    // Implementation would analyze mana curve
    return { curve: [], issues: [] }; // Placeholder
  }
}
