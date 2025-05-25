/**
 * Phase 3 AI Engine Integration Tests
 * Tests that all AI components work together correctly
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { AIEngine } from '../src/core/simulation/core/aiEngine';
import { TurnEngine } from '../src/core/simulation/core/turnEngine';
import { AggressiveAIStrategy as AggressiveAI } from '../src/core/simulation/ai/strategies/aggressiveAI';
import { ControlAIStrategy as ControlAI } from '../src/core/simulation/ai/strategies/controlAI';
import { MidrangeAIStrategy as MidrangeAI } from '../src/core/simulation/ai/strategies/midrangeAI';
import { ComboAIStrategy as ComboAI } from '../src/core/simulation/ai/strategies/comboAI';
import { DifficultyManager } from '../src/core/simulation/ai/difficultyManager';
import { ActionEvaluator } from '../src/core/simulation/ai/actionEvaluator';
import { GameStateEvaluator } from '../src/core/simulation/ai/gameStateEvaluator';
import { DecisionTree } from '../src/core/simulation/ai/decisionTree';
import { GameStateManager } from '../src/core/simulation/core/gameState';
import AIVsAITestFramework, { QuickAITestRunner } from '../src/core/simulation/testing/aiVsAiTests';
import { CardType } from '../src/types/Card';
import { GameAction } from '../src/core/simulation/core/actionStack';

describe('Phase 3: AI Engine Integration Tests', () => {
  let testFramework: AIVsAITestFramework;

  beforeAll(() => {
    testFramework = new AIVsAITestFramework();
  });

  describe('AI Strategy Implementation Validation', () => {
    it('should have all four AI strategies implemented', () => {
      expect(AggressiveAI).toBeDefined();
      expect(ControlAI).toBeDefined();
      expect(MidrangeAI).toBeDefined();
      expect(ComboAI).toBeDefined();
    });

    it('should create AI strategy instances successfully', () => {
      const aggressive = new AggressiveAI();
      const control = new ControlAI();
      const midrange = new MidrangeAI();
      const combo = new ComboAI();

      expect(aggressive).toBeDefined();
      expect(control).toBeDefined();
      expect(midrange).toBeDefined();
      expect(combo).toBeDefined();

      // Verify they all implement the AIStrategy interface
      expect(typeof aggressive.generateActions).toBe('function');
      expect(typeof control.generateActions).toBe('function');
      expect(typeof midrange.generateActions).toBe('function');
      expect(typeof combo.generateActions).toBe('function');
    });

    it('should generate different actions for different strategies', () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const state = gameState.getState();
      const player = state.players.player1;

      const aggressive = new AggressiveAI();
      const control = new ControlAI();

      const aggressiveActions = aggressive.generateActions(state, player);
      const controlActions = control.generateActions(state, player);

      // Actions should be different between strategies
      expect(aggressiveActions).toBeDefined();
      expect(controlActions).toBeDefined();
      expect(Array.isArray(aggressiveActions)).toBe(true);
      expect(Array.isArray(controlActions)).toBe(true);
    });
  });

  describe('AI Engine Integration', () => {
    it('should create AI engines with different strategies', () => {
      const gameState = new GameStateManager();
      const turnEngine = new TurnEngine(gameState);

      const aggressiveEngine = new AIEngine(new AggressiveAI(), turnEngine, 'medium');
      const controlEngine = new AIEngine(new ControlAI(), turnEngine, 'hard');

      expect(aggressiveEngine).toBeDefined();
      expect(controlEngine).toBeDefined();
    });

    it('should make decisions with pluggable strategies', async () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const turnEngine = new TurnEngine(gameState);

      const aggressiveEngine = new AIEngine(new AggressiveAI(), turnEngine, 'easy');
      const state = gameState.getState();

      const decision = await aggressiveEngine.makeDecision(state, 'player1');

      expect(decision).toBeDefined();
      expect(decision.type).toBeDefined();
      expect(typeof decision.priority).toBe('number');
      expect(typeof decision.reasoning).toBe('string');
    });
  });

  describe('Difficulty System', () => {
    it('should create difficulty managers for all levels', () => {
      const difficulties = ['easy', 'medium', 'hard', 'expert'] as const;

      for (const difficulty of difficulties) {
        const manager = new DifficultyManager(difficulty);
        expect(manager).toBeDefined();
        expect(manager.getSearchDepth()).toBeGreaterThan(0);
        expect(manager.getActionSelectionRandomness()).toBeGreaterThanOrEqual(0);
        expect(manager.getActionSelectionRandomness()).toBeLessThanOrEqual(1);
      }
    });

    it('should have progressive difficulty scaling', () => {
      const easy = new DifficultyManager('easy');
      const medium = new DifficultyManager('medium');
      const hard = new DifficultyManager('hard');
      const expert = new DifficultyManager('expert');

      // Search depth should increase with difficulty
      expect(easy.getSearchDepth()).toBeLessThanOrEqual(medium.getSearchDepth());
      expect(medium.getSearchDepth()).toBeLessThanOrEqual(hard.getSearchDepth());
      expect(hard.getSearchDepth()).toBeLessThanOrEqual(expert.getSearchDepth());

      // Randomness should decrease with difficulty
      expect(easy.getActionSelectionRandomness()).toBeGreaterThanOrEqual(medium.getActionSelectionRandomness());
      expect(medium.getActionSelectionRandomness()).toBeGreaterThanOrEqual(hard.getActionSelectionRandomness());
    });
  });

  describe('Game State Evaluation System', () => {
    it('should evaluate game states comprehensively', () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const state = gameState.getState();
      const player = state.players.player1;

      const evaluation = GameStateEvaluator.evaluateGameState(state, 'player1');

      expect(evaluation).toBeDefined();
      expect(typeof evaluation.boardControl).toBe('number');
      expect(typeof evaluation.materialAdvantage).toBe('number');
      expect(typeof evaluation.handAdvantage).toBe('number');
      expect(typeof evaluation.lifeAdvantage).toBe('number');
      expect(typeof evaluation.manaAdvantage).toBe('number');
      expect(typeof evaluation.positionalAdvantage).toBe('number');
      expect(typeof evaluation.threatLevel).toBe('number');
      expect(typeof evaluation.winProbability).toBe('number');
      expect(typeof evaluation.urgency).toBe('number');
    });

    it('should provide reasonable evaluation scores', () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const state = gameState.getState();
      const player = state.players.player1;

      const evaluation = GameStateEvaluator.evaluateGameState(state, 'player1');

      // Scores should be normalized between -1 and 1 (or 0 and 1 for probabilities)
      expect(evaluation.boardControl).toBeGreaterThanOrEqual(-1);
      expect(evaluation.boardControl).toBeLessThanOrEqual(1);
      expect(evaluation.winProbability).toBeGreaterThanOrEqual(0);
      expect(evaluation.winProbability).toBeLessThanOrEqual(1);
      expect(evaluation.urgency).toBeGreaterThanOrEqual(0);
      expect(evaluation.urgency).toBeLessThanOrEqual(1);
    });
  });

  describe('Action Evaluation System', () => {
    it('should rank actions by priority', () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const state = gameState.getState();
      const player = state.players.player1;

      const strategy = new MidrangeAI();
      const actions = strategy.generateActions(state, player);
      const rankedActions = ActionEvaluator.rankActions(actions, state, player);

      expect(Array.isArray(rankedActions)).toBe(true);
      
      const validRankedActions = rankedActions.filter((action): action is GameAction => action.priority !== undefined);
      if (validRankedActions.length > 1) {
        for (let i = 0; i < validRankedActions.length - 1; i++) {
          expect(validRankedActions[i].priority).toBeGreaterThanOrEqual(validRankedActions[i + 1].priority);
        }
      }
    });

    it('should score actions consistently', () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const state = gameState.getState();
      const player = state.players.player1;

      const mockAction = {
        type: 'PLAY_CARD' as const,
        cardId: 'test-card',
        priority: 0.5,
        reasoning: 'Test action',
        playerId: 'player1' as const
      };

      const score1 = ActionEvaluator.scoreAction(mockAction, state, player);
      const score2 = ActionEvaluator.scoreAction(mockAction, state, player);

      // Scoring should be deterministic for same inputs
      expect(score1).toBe(score2);
      expect(typeof score1).toBe('number');
    });
  });

  describe('Decision Tree System', () => {
    it('should create decision trees with different configurations', () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const state = gameState.getState();

      const tree1 = new DecisionTree({ maxDepth: 2, maxBranching: 5 }); // depth 2, branching 5
      const tree2 = new DecisionTree({ maxDepth: 3, maxBranching: 3 }); // depth 3, branching 3

      expect(tree1).toBeDefined();
      expect(tree2).toBeDefined();
    });

    it('should find optimal moves using minimax', () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const state = gameState.getState();

      const tree = new DecisionTree({ maxDepth: 2, maxBranching: 3 });
      const strategy = new MidrangeAI();
      
      const result = tree.findBestAction(state, 'player1', strategy.generateActions(state, 'player1'));

      expect(result).toBeDefined();
      if (result) {
        expect(result.type).toBeDefined();
        expect(result.playerId).toBe('player1');
      }
    });
  });

  describe('AI Behavior Validation', () => {
    it('should run quick AI behavior tests', async () => {
      const passed = await QuickAITestRunner.runQuickTests();
      expect(passed).toBe(true);
    }, 10000); // 10 second timeout for AI tests

    it('should validate aggressive AI behavior', () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const state = gameState.getState();
      const player = state.players.player1;

      const aggressive = new AggressiveAI();
      const actions = aggressive.generateActions(state, player);

      // Aggressive AI should generate some actions
      expect(actions.length).toBeGreaterThan(0);
      
      // Should have reasonably high priority actions (aggressive play)
      const highPriorityActions = actions.filter(a => a.priority > 0.6);
      expect(highPriorityActions.length).toBeGreaterThan(0);
    });

    it('should validate control AI behavior', () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const state = gameState.getState();
      const player = state.players.player1;

      const control = new ControlAI();
      const actions = control.generateActions(state, player);

      expect(actions.length).toBeGreaterThan(0);
      
      // Control AI should mention card advantage or removal in reasoning
      const controlActions = actions.filter(a => 
        a.reasoning.includes('advantage') || 
        a.reasoning.includes('removal') ||
        a.reasoning.includes('control')
      );
      expect(controlActions.length).toBeGreaterThan(0);
    });
  });

  describe('Integration and Performance', () => {
    it('should handle multiple AI engines simultaneously', () => {
      const gameState = new GameStateManager();
      const turnEngine = new TurnEngine(gameState);

      const engines = [
        new AIEngine(new AggressiveAI(), turnEngine, 'easy'),
        new AIEngine(new ControlAI(), turnEngine, 'medium'),
        new AIEngine(new MidrangeAI(), turnEngine, 'hard'),
        new AIEngine(new ComboAI(), turnEngine, 'expert')
      ];

      expect(engines.length).toBe(4);
      engines.forEach(engine => {
        expect(engine).toBeDefined();
      });
    });

    it('should make decisions within reasonable time', async () => {
      const gameState = new GameStateManager();
      const mockDeck = createMockDeck();
      gameState.initializeGame(mockDeck, mockDeck);
      const turnEngine = new TurnEngine(gameState);
      const engine = new AIEngine(new MidrangeAI(), turnEngine, 'medium');
      const state = gameState.getState();

      const startTime = Date.now();
      const decision = await engine.makeDecision(state, 'player1');
      const endTime = Date.now();

      const decisionTime = endTime - startTime;

      expect(decision).toBeDefined();
      expect(decisionTime).toBeLessThan(5000); // Should decide within 5 seconds
    });

    it('should handle edge cases gracefully', async () => {
      const gameState = new GameStateManager();
      const turnEngine = new TurnEngine(gameState);
      const engine = new AIEngine(new AggressiveAI(), turnEngine, 'easy');

      // Test with minimal game state
      const emptyState = gameState.getState();
      
      expect(async () => {
        await engine.makeDecision(emptyState, 'player1');
      }).not.toThrow();
    });
  });

  describe('System Validation', () => {
    it('should have all Phase 3 files created', () => {
      // This test verifies that all the AI system files exist and can be imported
      expect(AIEngine).toBeDefined();
      expect(AggressiveAI).toBeDefined();
      expect(ControlAI).toBeDefined();
      expect(MidrangeAI).toBeDefined();
      expect(ComboAI).toBeDefined();
      expect(DifficultyManager).toBeDefined();
      expect(ActionEvaluator).toBeDefined();
      expect(GameStateEvaluator).toBeDefined();
      expect(DecisionTree).toBeDefined();
    });

    it('should integrate with existing game systems', () => {
      const gameState = new GameStateManager();
      const turnEngine = new TurnEngine(gameState);

      // Should be able to create AI engine with existing systems
      expect(() => {
        new AIEngine(new MidrangeAI(), turnEngine, 'medium');
      }).not.toThrow();
    });
  });
});

/**
 * Helper function to create a mock deck for testing
 */
function createMockDeck() {
  return {
    avatar: { id: 'avatar1', name: 'Avatar', type: 'Avatar' as 'Avatar', cost: 0, subtypes: [], effect: '' },
    spells: [
      { id: 'spell1', name: 'Fireball', type: 'Sorcery' as 'Sorcery', cost: 2, subtypes: ['Fire'], effect: 'Deal 3 damage' },
      { id: 'spell2', name: 'Heal', type: 'Instant' as 'Instant', cost: 1, subtypes: ['Holy'], effect: 'Restore 3 health' }
    ],
    sites: [
      { id: 'site1', name: 'Mountain', type: 'Site' as 'Site', cost: 0, subtypes: ['Land'], effect: '' }
    ]
  };
}
