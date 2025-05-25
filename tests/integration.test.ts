import { describe, it, expect, beforeAll, vi } from 'vitest'
import { BrowserDeckBuilder } from '../src/browser/unified-deck-builder'

describe('Integration Tests', () => {
  let deckBuilder: BrowserDeckBuilder
  
  beforeAll(async () => {
    deckBuilder = new BrowserDeckBuilder()
    
    // Mock browser environment
    global.fetch = vi.fn()
    global.window = {} as any
    global.document = {} as any
  })

  describe('Browser Deck Builder', () => {
    it('should initialize without errors', () => {
      expect(deckBuilder).toBeDefined()
      expect(deckBuilder.isInitialized).toBe(false)
    })

    it('should handle initialization gracefully', async () => {
      // Mock successful data loading
      const mockCardData = {
        uniqueCards: [
          {
            productId: 'test1',
            name: 'Test Card',
            cleanName: 'test_card',
            type: 'Minion',
            mana_cost: 2,
            elements: ['Fire'],
            text: 'Test card',
            baseName: 'Test Card',
            rarity: 'Common'
          }
        ],
        avatars: [
          {
            productId: 'avatar1',
            name: 'Test Avatar',
            type: 'Avatar',
            elements: ['Fire'],
            baseName: 'Test Avatar'
          }
        ],
        sites: [
          {
            productId: 'site1',
            name: 'Test Site',
            type: 'Site',
            elements: ['Fire'],
            baseName: 'Test Site'
          }
        ]
      }

      // Mock the loadBrowserCardData method
      deckBuilder.loadBrowserCardData = vi.fn().mockResolvedValue(mockCardData)

      await deckBuilder.initialize()
      expect(deckBuilder.isInitialized).toBe(true)
      expect(deckBuilder.cardData).toBeDefined()
    })

    it('should fall back to sample data on load failure', async () => {
      const fallbackBuilder = new BrowserDeckBuilder()
      
      // Mock failed data loading
      fallbackBuilder.loadBrowserCardData = vi.fn().mockRejectedValue(new Error('Failed to load'))

      await fallbackBuilder.initialize()
      expect(fallbackBuilder.isInitialized).toBe(true)
      expect(fallbackBuilder.cardData).toBeDefined()
      expect(fallbackBuilder.cardData.uniqueCards.length).toBeGreaterThan(0)
    })

    it('should build decks after initialization', async () => {
      await deckBuilder.initialize()
      
      const preferences = {
        preferredElements: ['Fire'],
        preferredArchetype: 'Aggro',
        avatarName: null
      }

      const result = await deckBuilder.buildDeck(preferences)
      
      expect(result).toBeDefined()
      expect(result.spells).toBeDefined()
      expect(result.sites).toBeDefined()
      expect(result.avatar).toBeDefined()
      expect(result.stats).toBeDefined()
      expect(Array.isArray(result.spells)).toBe(true)
      expect(Array.isArray(result.sites)).toBe(true)
    })

    it('should get available data correctly', async () => {
      await deckBuilder.initialize()
      
      const avatars = await deckBuilder.getAvatars()
      const sites = await deckBuilder.getSites()
      const elements = deckBuilder.getAvailableElements()
      const archetypes = deckBuilder.getAvailableArchetypes()
      
      expect(Array.isArray(avatars)).toBe(true)
      expect(Array.isArray(sites)).toBe(true)
      expect(Array.isArray(elements)).toBe(true)
      expect(Array.isArray(archetypes)).toBe(true)
      
      expect(avatars.length).toBeGreaterThan(0)
      expect(sites.length).toBeGreaterThan(0)
      expect(elements.length).toBeGreaterThan(0)
      expect(archetypes.length).toBeGreaterThan(0)
    })

    it('should calculate synergy for decks', async () => {
      await deckBuilder.initialize()
      
      const testDeck = deckBuilder.cardData.uniqueCards.slice(0, 10)
      const synergy = await deckBuilder.calculateSynergy(testDeck)
      
      expect(typeof synergy).toBe('number')
      expect(synergy).toBeGreaterThanOrEqual(0)
    })

    it('should validate decks', async () => {
      await deckBuilder.initialize()
      
      const mockDeck = {
        avatar: deckBuilder.cardData.avatars[0],
        sites: deckBuilder.cardData.sites.slice(0, 5),
        spellbook: deckBuilder.cardData.uniqueCards.slice(0, 10)
      }

      const validation = await deckBuilder.validateDeck(mockDeck)
      expect(validation).toBeDefined()
    })

    it('should handle errors gracefully', async () => {
      const errorBuilder = new BrowserDeckBuilder()
      
      // Test building deck without initialization
      await expect(errorBuilder.buildDeck({
        preferredElements: ['Fire']
      })).rejects.toThrow()
    })
  })

  describe('Data Loading and Caching', () => {
    it('should not reload data if already initialized', async () => {
      await deckBuilder.initialize()
      const firstData = deckBuilder.cardData
      
      await deckBuilder.initialize() // Second call
      const secondData = deckBuilder.cardData
      
      expect(firstData).toBe(secondData) // Should be the same object reference
    })

    it('should provide sample data when no real data available', () => {
      const sampleData = deckBuilder.getSampleCardData()
      
      expect(sampleData).toBeDefined()
      expect(sampleData.uniqueCards.length).toBeGreaterThan(0)
      expect(sampleData.avatars.length).toBeGreaterThan(0)
      expect(sampleData.sites.length).toBeGreaterThan(0)
      
      // Check sample data structure
      sampleData.uniqueCards.forEach(card => {
        expect(card.name).toBeDefined()
        expect(card.type).toBeDefined()
        expect(Array.isArray(card.elements)).toBe(true)
      })
    })
  })

  describe('Deck Building Logic', () => {
    it('should build decks with proper element distribution', async () => {
      await deckBuilder.initialize()
      
      const result = await deckBuilder.buildDeck({
        preferredElements: ['Fire', 'Water'],
        preferredArchetype: 'Midrange'
      })
      
      // Check that the deck contains cards of preferred elements
      const hasFireCards = result.spells.some(card => 
        card.elements?.includes('Fire')
      )
      const hasWaterCards = result.spells.some(card => 
        card.elements?.includes('Water')
      )
      
      expect(hasFireCards || hasWaterCards).toBe(true)
    })

    it('should respect deck size constraints', async () => {
      await deckBuilder.initialize()
      
      const result = await deckBuilder.buildDeck({
        preferredElements: ['Earth']
      })
      
      expect(result.sites.length).toBeGreaterThan(0)
      expect(result.sites.length).toBeLessThanOrEqual(30)
      expect(result.spells.length).toBeGreaterThan(0)
      expect(result.spells.length).toBeLessThanOrEqual(50)
    })

    it('should select appropriate avatar based on preferences', async () => {
      await deckBuilder.initialize()
      
      const result = await deckBuilder.buildDeck({
        preferredElements: ['Air'],
        avatarName: null
      })
      
      expect(result.avatar).toBeDefined()
      expect(result.avatar.type).toBe('Avatar')
      
      // If air cards are available, avatar should potentially support air
      if (result.spells.some(card => card.elements?.includes('Air'))) {
        expect(result.avatar.elements?.includes('Air') || 
               result.avatar.elements?.length === 0).toBe(true)
      }
    })
  })
})
