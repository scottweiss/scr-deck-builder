import { describe, it, expect, beforeAll } from 'vitest'
import { Card, Element, CardType, CardRarity } from '../src/types/Card'
import { calculateSynergy } from '../src/analyses/synergy/synergyCalculator'
import { calculateMechanicSynergy } from '../src/analyses/synergy/mechanicalSynergy'
import { calculateElementalSynergy } from '../src/analyses/synergy/elementalSynergy'
import { analyzeElementalSynergy } from '../src/analyses/synergy/deckStats'

describe('Synergy Calculation Tests', () => {
  let fireCards: Card[]
  let waterCards: Card[]
  let mixedDeck: Card[]

  beforeAll(() => {
    // Create test cards with different elements and mechanics
    fireCards = [
      {
        productId: 'fire1',
        name: 'Flame Sprite',
        cleanName: 'flame_sprite',
        type: CardType.Minion,
        mana_cost: 2,
        cost: 2,
        elements: [Element.Fire],
        text: 'Haste. When this attacks, deal 1 damage to the defending player.',
        power: 2,
        life: 1,
        rarity: CardRarity.Common,
        baseName: 'Flame Sprite',
        imageUrl: '', categoryId: '', groupId: '', url: '', modifiedOn: '',
        imageCount: '', extRarity: 'Common', extDescription: 'Haste. When this attacks, deal 1 damage to the defending player.',
        extCost: '2', extThreshold: 'F', extElement: 'Fire', extTypeLine: 'Minion',
        extCardCategory: 'Minion', extCardType: 'Minion', subTypeName: '',
        extPowerRating: '2', extCardSubtype: '', extFlavorText: '', extDefensePower: '',
        extLife: '1', setName: 'Test', threshold: 'F', subtype: ''
      },
      {
        productId: 'fire2',
        name: 'Fire Bolt',
        cleanName: 'fire_bolt',
        type: CardType.Magic,
        mana_cost: 1,
        cost: 1,
        elements: [Element.Fire],
        text: 'Deal 2 damage to any target.',
        rarity: 'Common',
        baseName: 'Fire Bolt',
        imageUrl: '', categoryId: '', groupId: '', url: '', modifiedOn: '',
        imageCount: '', extRarity: 'Common', extDescription: 'Deal 2 damage to any target.',
        extCost: '1', extThreshold: 'F', extElement: 'Fire', extTypeLine: 'Magic',
        extCardCategory: 'Magic', extCardType: 'Magic', subTypeName: '',
        extPowerRating: '', extCardSubtype: '', extFlavorText: '', extDefensePower: '',
        extLife: '', setName: 'Test', threshold: 'F', subtype: ''
      }
    ]

    waterCards = [
      {
        productId: 'water1',
        name: 'Sea Turtle',
        cleanName: 'sea_turtle',
        type: CardType.Minion,
        mana_cost: 3,
        cost: 3,
        elements: [Element.Water],
        text: 'When this enters play, draw a card.',
        power: 1,
        life: 4,
        rarity: 'Common',
        baseName: 'Sea Turtle',
        imageUrl: '', categoryId: '', groupId: '', url: '', modifiedOn: '',
        imageCount: '', extRarity: 'Common', extDescription: 'When this enters play, draw a card.',
        extCost: '3', extThreshold: 'W', extElement: 'Water', extTypeLine: 'Minion',
        extCardCategory: 'Minion', extCardType: 'Minion', subTypeName: '',
        extPowerRating: '1', extCardSubtype: '', extFlavorText: '', extDefensePower: '',
        extLife: '4', setName: 'Test', threshold: 'W', subtype: ''
      },
      {
        productId: 'water2',
        name: 'Healing Wave',
        cleanName: 'healing_wave',
        type: CardType.Magic,
        mana_cost: 2,
        cost: 2,
        elements: [Element.Water],
        text: 'Restore 3 health to any target.',
        rarity: 'Common',
        baseName: 'Healing Wave',
        imageUrl: '', categoryId: '', groupId: '', url: '', modifiedOn: '',
        imageCount: '', extRarity: 'Common', extDescription: 'Restore 3 health to any target.',
        extCost: '2', extThreshold: 'W', extElement: 'Water', extTypeLine: 'Magic',
        extCardCategory: 'Magic', extCardType: 'Magic', subTypeName: '',
        extPowerRating: '', extCardSubtype: '', extFlavorText: '', extDefensePower: '',
        extLife: '', setName: 'Test', threshold: 'W', subtype: ''
      }
    ]

    mixedDeck = [...fireCards, ...waterCards]
  })

  describe('Overall Synergy Calculation', () => {
    it('should calculate synergy for cards of the same element', () => {
      const fireSprite = fireCards[0]
      const fireDeck = [fireCards[1]]
      
      const synergy = calculateSynergy(fireSprite, fireDeck)
      expect(synergy).toBeGreaterThan(0)
      expect(typeof synergy).toBe('number')
    })

    it('should calculate lower synergy for cards of different elements', () => {
      const fireSprite = fireCards[0]
      const waterDeck = [waterCards[0]]
      const fireDeck = [fireCards[1]]
      
      const waterSynergy = calculateSynergy(fireSprite, waterDeck)
      const fireSynergy = calculateSynergy(fireSprite, fireDeck)
      
      expect(fireSynergy).toBeGreaterThan(waterSynergy)
    })

    it('should handle empty deck gracefully', () => {
      const card = fireCards[0]
      const synergy = calculateSynergy(card, [])
      expect(synergy).toBe(0)
    })

    it('should handle null/undefined inputs', () => {
      expect(calculateSynergy(null as any, fireCards)).toBe(0)
      expect(calculateSynergy(fireCards[0], null as any)).toBe(0)
    })
  })

  describe('Elemental Synergy', () => {
    it('should calculate high elemental synergy for same elements', () => {
      const fireCard = fireCards[0]
      const fireDeck = [fireCards[1]]
      
      const synergy = calculateElementalSynergy(fireCard, fireDeck)
      expect(synergy).toBeGreaterThan(0)
    })

    it('should calculate lower synergy for different elements', () => {
      const fireCard = fireCards[0]
      const waterDeck = [waterCards[0]]
      
      const synergy = calculateElementalSynergy(fireCard, waterDeck)
      expect(synergy).toBe(0) // No elemental synergy for different elements
    })

    it('should analyze elemental synergy distribution in deck', () => {
      const analysis = analyzeElementalSynergy(mixedDeck)
      expect(Array.isArray(analysis)).toBe(true)
      expect(analysis.length).toBeGreaterThan(0)
      
      // Should find some element combinations
      analysis.forEach(([elements, count]) => {
        expect(Array.isArray(elements)).toBe(true)
        expect(typeof count).toBe('number')
        expect(count).toBeGreaterThan(0)
      })
    })
  })

  describe('Mechanical Synergy', () => {
    it('should calculate mechanical synergy based on card text', () => {
      const cardWithDamage = fireCards[1] // Fire Bolt
      const deckWithDamage = [fireCards[0]] // Flame Sprite (has damage effect)
      
      const synergy = calculateMechanicSynergy(cardWithDamage, deckWithDamage)
      expect(typeof synergy).toBe('number')
      expect(synergy).toBeGreaterThanOrEqual(0)
    })

    it('should handle cards without text', () => {
      const cardWithoutText = {
        ...fireCards[0],
        text: ''
      }
      
      const synergy = calculateMechanicSynergy(cardWithoutText, fireCards)
      expect(typeof synergy).toBe('number')
      expect(synergy).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Cost Curve Synergy', () => {
    it('should prefer balanced mana curves', () => {
      // Create decks with different cost distributions
      const lowCostDeck = fireCards.map(card => ({ ...card, mana_cost: 1, cost: 1 }))
      const highCostDeck = fireCards.map(card => ({ ...card, mana_cost: 6, cost: 6 }))
      
      const mediumCostCard = { ...fireCards[0], mana_cost: 3, cost: 3 }
      
      const lowSynergy = calculateSynergy(mediumCostCard, lowCostDeck)
      const highSynergy = calculateSynergy(mediumCostCard, highCostDeck)
      
      // Both should have some synergy as they help balance the curve
      expect(lowSynergy).toBeGreaterThan(0)
      expect(highSynergy).toBeGreaterThan(0)
    })
  })

  describe('Combo Detection', () => {
    it('should identify potential combos in synergy calculation', () => {
      // Create cards that could combo together
      const comboCard1 = {
        ...fireCards[0],
        text: 'When this deals damage, draw a card.'
      }
      const comboCard2 = {
        ...fireCards[1],
        text: 'Deal 1 damage to any target.'
      }
      
      const synergy = calculateSynergy(comboCard1, [comboCard2])
      expect(synergy).toBeGreaterThan(0)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large decks efficiently', () => {
      const largeDeck = Array(100).fill(null).map((_, i) => ({
        ...fireCards[0],
        productId: `large_${i}`,
        name: `Large Card ${i}`,
        baseName: `Large Card ${i}`
      }))
      
      const start = Date.now()
      const synergy = calculateSynergy(fireCards[0], largeDeck)
      const end = Date.now()
      
      expect(synergy).toBeGreaterThan(0)
      expect(end - start).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should be deterministic', () => {
      const card = fireCards[0]
      const deck = fireCards.slice(1)
      
      const synergy1 = calculateSynergy(card, deck)
      const synergy2 = calculateSynergy(card, deck)
      
      expect(synergy1).toBe(synergy2)
    })

    it('should handle cards with missing properties', () => {
      const incompleteCard = {
        productId: 'incomplete',
        name: 'Incomplete Card',
        cleanName: 'incomplete',
        baseName: 'Incomplete Card'
      } as Card
      
      const synergy = calculateSynergy(incompleteCard, fireCards)
      expect(typeof synergy).toBe('number')
      expect(synergy).toBeGreaterThanOrEqual(0)
    })
  })
})
