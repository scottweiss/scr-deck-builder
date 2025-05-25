import { describe, it, expect, beforeAll } from 'vitest'
import { Card, Element, CardType } from '../src/types/Card'
import { createTestDeck, createBaselineDeck, getMetaDecks } from '../src/core/simulation/testing/testDeckUtils'
import { DeckTestSuite } from '../src/core/simulation/testing/deckTestSuite'

describe('Simulation Tests', () => {
  let deckTestSuite: DeckTestSuite
  let testDeck: Card[]
  let baselineDeck: Card[]

  beforeAll(() => {
    deckTestSuite = new DeckTestSuite()
    testDeck = createTestDeck('fire', 'aggro')
    baselineDeck = createBaselineDeck()
  })

  describe('Test Deck Creation', () => {
    it('should create test decks with proper properties', () => {
      const fireDeck = createTestDeck('fire', 'aggro')
      const waterDeck = createTestDeck('water', 'control')
      
      expect(fireDeck.length).toBe(40)
      expect(waterDeck.length).toBe(40)
      
      // Check that fire deck has fire elements
      const fireElements = fireDeck.filter(card => 
        card.elements?.includes(Element.Fire)
      )
      expect(fireElements.length).toBeGreaterThan(0)
      
      // Check that water deck has water elements
      const waterElements = waterDeck.filter(card => 
        card.elements?.includes(Element.Water)
      )
      expect(waterElements.length).toBeGreaterThan(0)
    })

    it('should create baseline deck for testing', () => {
      const baseline = createBaselineDeck()
      
      expect(baseline.length).toBe(40)
      expect(baseline.every(card => card.productId.startsWith('baseline_'))).toBe(true)
      
      // Check mana curve distribution
      const manaCosts = baseline.map(card => card.mana_cost || 0)
      const avgCost = manaCosts.reduce((sum, cost) => sum + cost, 0) / manaCosts.length
      expect(avgCost).toBeGreaterThan(0)
      expect(avgCost).toBeLessThan(10)
    })

    it('should generate meta decks', () => {
      const metaDecks = getMetaDecks()
      
      expect(metaDecks.length).toBeGreaterThan(0)
      expect(metaDecks.every(deck => deck.name && deck.cards.length > 0)).toBe(true)
      
      // Check that meta decks have different archetypes
      const archetypes = metaDecks.map(deck => deck.name.toLowerCase())
      expect(archetypes.some(name => name.includes('aggro'))).toBe(true)
      expect(archetypes.some(name => name.includes('control'))).toBe(true)
    })
  })

  describe('Deck Testing', () => {
    it('should test deck against meta with reasonable results', async () => {
      const metaDecks = getMetaDecks().slice(0, 2) // Use fewer decks for faster testing
      
      const result = await deckTestSuite.testDeckAgainstMeta(
        testDeck,
        metaDecks,
        10 // Small number for testing
      )
      
      expect(result).toBeDefined()
      expect(result.overallWinRate).toBeGreaterThanOrEqual(0)
      expect(result.overallWinRate).toBeLessThanOrEqual(1)
      expect(result.matchupResults.length).toBe(metaDecks.length)
      
      result.matchupResults.forEach(matchup => {
        expect(matchup.winRate).toBeGreaterThanOrEqual(0)
        expect(matchup.winRate).toBeLessThanOrEqual(1)
        expect(matchup.averageTurns).toBeGreaterThan(0)
      })
    }, 30000) // Longer timeout for simulation

    it('should analyze matchup between two decks', async () => {
      const deck1 = { name: 'Fire Aggro', cards: createTestDeck('fire', 'aggro') }
      const deck2 = { name: 'Water Control', cards: createTestDeck('water', 'control') }
      
      const analysis = await deckTestSuite.analyzeMatchup(deck1, deck2, 5)
      
      expect(analysis).toBeDefined()
      expect(analysis.winRate).toBeGreaterThanOrEqual(0)
      expect(analysis.winRate).toBeLessThanOrEqual(1)
      expect(analysis.averageTurns).toBeGreaterThan(0)
      expect(analysis.favorability).toBeDefined()
      expect(Array.isArray(analysis.keyFactors)).toBe(true)
    }, 20000)

    it('should test deck consistency', async () => {
      const consistency = await deckTestSuite.testDeckConsistency(testDeck, 20)
      
      expect(consistency).toBeDefined()
      expect(consistency.consistencyScore).toBeGreaterThanOrEqual(0)
      expect(consistency.consistencyScore).toBeLessThanOrEqual(1)
      expect(consistency.varianceMetrics).toBeDefined()
      expect(Array.isArray(consistency.recommendations)).toBe(true)
    }, 15000)

    it('should test different AI strategies', async () => {
      const opponentDeck = createTestDeck('water', 'control')
      const strategies = await deckTestSuite.testDeckStrategies(testDeck, opponentDeck, 5)
      
      expect(strategies).toBeDefined()
      expect(Object.keys(strategies).length).toBeGreaterThan(0)
      
      Object.values(strategies).forEach(winRate => {
        expect(winRate).toBeGreaterThanOrEqual(0)
        expect(winRate).toBeLessThanOrEqual(1)
      })
    }, 15000)
  })

  describe('Deck Optimization', () => {
    it('should optimize deck composition', async () => {
      const cardPool = [...testDeck, ...createTestDeck('earth', 'midrange')]
      
      const optimization = await deckTestSuite.optimizeDeck(
        testDeck,
        cardPool,
        3 // Small number for testing
      )
      
      expect(optimization).toBeDefined()
      expect(optimization.originalDeck).toBeDefined()
      expect(optimization.optimizedDeck).toBeDefined()
      expect(Array.isArray(optimization.improvements)).toBe(true)
      expect(typeof optimization.winRateImprovement).toBe('number')
    }, 30000)

    it('should generate performance report', async () => {
      const report = await deckTestSuite.generatePerformanceReport(
        testDeck,
        'Test Fire Aggro',
        10 // Small number for testing
      )
      
      expect(report).toBeDefined()
      expect(report.deckName).toBe('Test Fire Aggro')
      expect(report.overallRating).toBeDefined()
      expect(Array.isArray(report.strengths)).toBe(true)
      expect(Array.isArray(report.weaknesses)).toBe(true)
      expect(Array.isArray(report.recommendations)).toBe(true)
      expect(report.metaPerformance).toBeDefined()
      expect(report.consistency).toBeDefined()
    }, 45000)
  })
})
