import { describe, it, expect, beforeAll } from 'vitest'
import { Card, Element, CardType, CardRarity } from '../src/types/Card'
import { buildSpellbook } from '../src/core/deck/builder/deckBuilder'
import { calculateSynergy } from '../src/analyses/synergy/synergyCalculator'
import { getDeckStats } from '../src/analyses/synergy/deckStats'

describe('Deck Builder Tests', () => {
  let sampleCards: Card[]
  
  beforeAll(() => {
    // Create sample cards for testing
    sampleCards = [
      {
        productId: 'test1',
        name: 'Fire Sprite',
        cleanName: 'fire_sprite',
        type: CardType.Minion,
        mana_cost: 2,
        cost: 2,
        elements: [Element.Fire],
        text: 'Haste. When summoned, deal 1 damage.',
        power: 2,
        life: 1,
        rarity: CardRarity.Ordinary,
        baseName: 'Fire Sprite',
        imageUrl: '',
        categoryId: '',
        groupId: '',
        url: '',
        modifiedOn: '',
        imageCount: '',
        extRarity: 'Common',
        extDescription: 'Haste. When summoned, deal 1 damage.',
        extCost: '2',
        extThreshold: 'F',
        extElement: 'Fire',
        extTypeLine: 'Minion',
        extCardCategory: 'Minion',
        extCardType: 'Minion',
        subTypeName: '',
        extPowerRating: '2',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '1',
        setName: 'Test',
        threshold: 'F',
        subtype: ''
      },
      {
        productId: 'test2',
        name: 'Lightning Bolt',
        cleanName: 'lightning_bolt',
        type: CardType.Magic,
        mana_cost: 1,
        cost: 1,
        elements: [Element.Fire],
        text: 'Deal 3 damage to any target.',
        rarity: CardRarity.Common,
        baseName: 'Lightning Bolt',
        imageUrl: '',
        categoryId: '',
        groupId: '',
        url: '',
        modifiedOn: '',
        imageCount: '',
        extRarity: 'Common',
        extDescription: 'Deal 3 damage to any target.',
        extCost: '1',
        extThreshold: 'F',
        extElement: 'Fire',
        extTypeLine: 'Magic',
        extCardCategory: 'Magic',
        extCardType: 'Magic',
        subTypeName: '',
        extPowerRating: '',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '',
        setName: 'Test',
        threshold: 'F',
        subtype: ''
      },
      {
        productId: 'test3',
        name: 'Water Elemental',
        cleanName: 'water_elemental',
        type: CardType.Minion,
        mana_cost: 3,
        cost: 3,
        elements: [Element.Water],
        text: 'When summoned, draw a card.',
        power: 2,
        life: 3,
        rarity: CardRarity.Common,
        baseName: 'Water Elemental',
        imageUrl: '',
        categoryId: '',
        groupId: '',
        url: '',
        modifiedOn: '',
        imageCount: '',
        extRarity: 'Common',
        extDescription: 'When summoned, draw a card.',
        extCost: '3',
        extThreshold: 'W',
        extElement: 'Water',
        extTypeLine: 'Minion',
        extCardCategory: 'Minion',
        extCardType: 'Minion',
        subTypeName: '',
        extPowerRating: '2',
        extCardSubtype: '',
        extFlavorText: '',
        extDefensePower: '',
        extLife: '3',
        setName: 'Test',
        threshold: 'W',
        subtype: ''
      }
    ]
  })

  describe('Synergy Calculation', () => {
    it('should calculate synergy between cards', () => {
      const card = sampleCards[0] // Fire Sprite
      const deck = [sampleCards[1]] // Lightning Bolt
      
      const synergy = calculateSynergy(card, deck)
      expect(synergy).toBeGreaterThan(0)
      expect(typeof synergy).toBe('number')
    })

    it('should return 0 synergy for empty deck', () => {
      const card = sampleCards[0]
      const synergy = calculateSynergy(card, [])
      expect(synergy).toBe(0)
    })

    it('should calculate higher synergy for same element cards', () => {
      const fireCard = sampleCards[0] // Fire Sprite
      const fireDeck = [sampleCards[1]] // Lightning Bolt (Fire)
      const waterDeck = [sampleCards[2]] // Water Elemental
      
      const fireSynergy = calculateSynergy(fireCard, fireDeck)
      const waterSynergy = calculateSynergy(fireCard, waterDeck)
      
      expect(fireSynergy).toBeGreaterThan(waterSynergy)
    })
  })

  describe('Deck Statistics', () => {
    it('should calculate deck stats correctly', () => {
      const deck = [sampleCards[0], sampleCards[1]] // Fire Sprite + Lightning Bolt
      const stats = getDeckStats(deck)
      
      expect(stats.elements[Element.Fire]).toBe(2)
      expect(stats.types[CardType.Minion]).toBe(1)
      expect(stats.types[CardType.Magic]).toBe(1)
      expect(stats.mana_curve[1]).toBe(1) // Lightning Bolt
      expect(stats.mana_curve[2]).toBe(1) // Fire Sprite
    })

    it('should handle empty deck', () => {
      const stats = getDeckStats([])
      expect(Object.keys(stats.elements)).toHaveLength(0)
      expect(Object.keys(stats.types)).toHaveLength(0)
      expect(Object.keys(stats.mana_curve)).toHaveLength(0)
    })
  })

  describe('Deck Building', () => {
    it('should build a spellbook with proper constraints', () => {
      // Create larger sample set for deck building
      const minions = Array(20).fill(null).map((_, i) => ({
        ...sampleCards[0],
        productId: `minion_${i}`,
        name: `Test Minion ${i}`,
        baseName: `Test Minion ${i}`,
        mana_cost: 1 + (i % 6),
        cost: 1 + (i % 6)
      }))
      
      const magics = Array(20).fill(null).map((_, i) => ({
        ...sampleCards[1],
        productId: `magic_${i}`,
        name: `Test Magic ${i}`,
        baseName: `Test Magic ${i}`,
        mana_cost: 1 + (i % 6),
        cost: 1 + (i % 6)
      }))

      const result = buildSpellbook({
        minions,
        artifacts: [],
        auras: [],
        magics,
        uniqueCards: [...minions, ...magics],
        sites: [],
        avatar: {
          ...sampleCards[0],
          type: CardType.Avatar,
          name: 'Test Avatar'
        },
        preferredArchetype: 'Midrange'
      })
      
      expect(result.spells).toBeDefined()
      expect(result.spells.length).toBeGreaterThan(0)
      expect(result.playabilityScore).toBeGreaterThan(0)
      expect(result.totalSynergy).toBeGreaterThanOrEqual(0)
      expect(result.copiesInDeck).toBeDefined()
    })

    it('should respect card limits', () => {
      const testCard = sampleCards[0]
      const largeCardPool = Array(60).fill(testCard)
      
      const result = buildSpellbook({
        minions: largeCardPool,
        artifacts: [],
        auras: [],
        magics: [],
        uniqueCards: largeCardPool,
        sites: [],
        avatar: {
          ...sampleCards[0],
          type: CardType.Avatar,
          name: 'Test Avatar'
        },
        preferredArchetype: 'Aggro'
      })
      
      // Should not have more than 4 copies of any single card
      const cardCounts = {}
      result.spells.forEach(card => {
        cardCounts[card.baseName] = (cardCounts[card.baseName] || 0) + 1
      })
      
      Object.values(cardCounts).forEach(count => {
        expect(count).toBeLessThanOrEqual(4)
      })
    })
  })
})
