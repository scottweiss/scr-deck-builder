// difficultyManager.ts
// Manages AI difficulty settings and modifies AI behavior accordingly

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export class DifficultyManager {
  private difficulty: AIDifficulty;

  constructor(difficulty: AIDifficulty = 'medium') {
    this.difficulty = difficulty;
  }

  getDifficulty(): AIDifficulty {
    return this.difficulty;
  }

  setDifficulty(level: AIDifficulty) {
    this.difficulty = level;
  }

  // Example: adjust randomness or depth based on difficulty
  getActionSelectionRandomness(): number {
    switch (this.difficulty) {
      case 'easy': return 0.5;
      case 'medium': return 0.2;
      case 'hard': return 0.05;
      case 'expert': return 0;
      default: return 0.2;
    }
  }

  getSearchDepth(): number {
    switch (this.difficulty) {
      case 'easy': return 2;
      case 'medium': return 4;
      case 'hard': return 6;
      case 'expert': return 8;
      default: return 4;
    }
  }

  /**
   * Configure an AI strategy with difficulty-based adjustments
   */
  configureStrategy(strategy: any, difficulty?: AIDifficulty): any {
    const targetDifficulty = difficulty || this.difficulty;
    
    // Return a configured version of the strategy
    return {
      ...strategy,
      difficulty: targetDifficulty,
      randomness: this.getActionSelectionRandomness(),
      searchDepth: this.getSearchDepth(),
      // Add any other difficulty-based configurations
      generateActions: strategy.generateActions?.bind(strategy) || (() => []),
      evaluateGameState: strategy.evaluateGameState?.bind(strategy) || (() => 0),
      selectAction: strategy.selectAction?.bind(strategy) || (() => null)
    };
  }
}
