import { Card, CardAllocation, Element } from '../../types/Card';
import { DeckBuildOptions, Deck, DeckMetadata } from '../../types/Deck';
import * as synergyCalculator from '../../analyses/synergy/synergyCalculator';
import * as deckOptimizer from './deckOptimizer';
import * as elementAnalyzer from '../../analyses/position/elementRequirementAnalyzer';
import * as deckPlayability from '../../analyses/playability/deckPlayability';
import * as cardCombos from '../cards/cardCombos';
import { Combo } from '../cards/cardCombos';

interface SpellbookResult {
  spells: Card[];
  playabilityScore: number;
  playabilityIssues: string[];
  totalSynergy: number;
  copiesInDeck: Record<string, number>; // Added this line
}

interface ComboPiece {
  card: Card;
  importance: number;
}

interface CardCombo {
  name: string;
  description: string;
  synergisticScore: number;
  percentComplete: number;
  pieces: ComboPiece[];
}

/**
 * Build a spellbook deck with the given card pool
 */
export function buildSpellbook(options: DeckBuildOptions): SpellbookResult {
  const {
    minions,
    artifacts,
    auras,
    magics,
    uniqueCards,
    avatar,
    allocation = {} as CardAllocation
  } = options;

  // Set default allocations if not provided
  const defaultAllocation: CardAllocation = {
    minions: 24,  // ~45%
    artifacts: 10, // ~20%
    auras: 6,     // ~12%
    magics: 15,   // ~30%
  };
  
  const cardAllocation: CardAllocation = {
    minions: allocation.minions ?? defaultAllocation.minions,
    artifacts: allocation.artifacts ?? defaultAllocation.artifacts,
    auras: allocation.auras ?? defaultAllocation.auras,
    magics: allocation.magics ?? defaultAllocation.magics,
  };
  
  let selectedSpells: Card[] = [];
  const copiesInDeck: Record<string, number> = {};
  
  // ENHANCEMENT: Identify potential card combos in the pool
  const availableCombos: Combo[] = cardCombos.identifyCardCombos([...minions, ...artifacts, ...auras, ...magics]);
  
  console.log(`Identified ${availableCombos.length} potential card combos in the card pool`);
  
  // If we have promising combos, prioritize them
  const comboPieces = new Set<string>();
  if (availableCombos.length > 0) {
    // Sort combos by synergy score
    availableCombos.sort((a: Combo, b: Combo) => b.synergy - a.synergy);
    
    // Log the top 3 combos
    console.log("Top card combos identified:");
    availableCombos.slice(0, 3).forEach((combo: Combo) => {
      console.log(`- ${combo.name}: ${combo.description}`);
      
      // Add combo pieces to our priority set
      // Assuming combo.cards contains the names of the cards in the combo
      combo.cards.forEach((cardName: string) => {
        comboPieces.add(cardName);
      });
    });
  }

  // Helper function to prioritize combo pieces
  const isComboCard = (card: Card): boolean => comboPieces.has(card.baseName);

  // Add minions
  console.log(`Selecting ${cardAllocation.minions} minions...`);
  let addedMinionCount = 0;
  const sortedMinions = [...minions]
    .filter((card: Card) => !selectedSpells.some((s: Card) => s.baseName === card.baseName))
    .sort((a: Card, b: Card) => {
      // Prioritize combo pieces
      if (isComboCard(a) !== isComboCard(b)) {
        return isComboCard(b) ? 1 : -1;
      }
      
      // Then by synergy
      return (synergyCalculator as any).calculateSynergy(b, selectedSpells) - 
             (synergyCalculator as any).calculateSynergy(a, selectedSpells);
    });

  for (const minion of sortedMinions) {
    const remaining = cardAllocation.minions - addedMinionCount;
    if (remaining <= 0) break;

    const before = selectedSpells.length;
    selectedSpells = (deckOptimizer as any).addCardWithCopies(minion, selectedSpells, remaining, copiesInDeck, avatar);
    addedMinionCount += (selectedSpells.length - before);
  }

  // Add artifacts
  console.log(`Selecting ${cardAllocation.artifacts} artifacts...`);
  let addedArtifactCount = 0;
  const sortedArtifacts = [...artifacts]
    .filter((card: Card) => !selectedSpells.some((s: Card) => s.baseName === card.baseName))
    .sort((a: Card, b: Card) => {
      // Prioritize combo pieces
      if (isComboCard(a) !== isComboCard(b)) {
        return isComboCard(b) ? 1 : -1;
      }
      
      return (synergyCalculator as any).calculateSynergy(b, selectedSpells) - 
             (synergyCalculator as any).calculateSynergy(a, selectedSpells);
    });

  for (const artifact of sortedArtifacts) {
    const remaining = cardAllocation.artifacts - addedArtifactCount;
    if (remaining <= 0) break;

    const before = selectedSpells.length;
    selectedSpells = (deckOptimizer as any).addCardWithCopies(artifact, selectedSpells, remaining, copiesInDeck, avatar);
    addedArtifactCount += (selectedSpells.length - before);
  }

  // Add auras
  console.log(`Selecting ${cardAllocation.auras} auras...`);
  let addedAuraCount = 0;
  const sortedAuras = [...auras]
    .filter((card: Card) => !selectedSpells.some((s: Card) => s.baseName === card.baseName))
    .sort((a: Card, b: Card) => {
      // Prioritize combo pieces
      if (isComboCard(a) !== isComboCard(b)) {
        return isComboCard(b) ? 1 : -1;
      }
      
      return (synergyCalculator as any).calculateSynergy(b, selectedSpells) - 
             (synergyCalculator as any).calculateSynergy(a, selectedSpells);
    });

  for (const aura of sortedAuras) {
    const remaining = cardAllocation.auras - addedAuraCount;
    if (remaining <= 0) break;

    const before = selectedSpells.length;
    selectedSpells = (deckOptimizer as any).addCardWithCopies(aura, selectedSpells, remaining, copiesInDeck, avatar);
    addedAuraCount += (selectedSpells.length - before);
  }

  // Add magic spells
  console.log(`Selecting ${cardAllocation.magics} magic spells...`);
  let addedMagicCount = 0;
  const sortedMagics = [...magics]
    .filter((card: Card) => !selectedSpells.some((s: Card) => s.baseName === card.baseName))
    .sort((a: Card, b: Card) => {
      // Prioritize combo pieces
      if (isComboCard(a) !== isComboCard(b)) {
        return isComboCard(b) ? 1 : -1;
      }
      
      return (synergyCalculator as any).calculateSynergy(b, selectedSpells) - 
             (synergyCalculator as any).calculateSynergy(a, selectedSpells);
    });

  for (const magic of sortedMagics) {
    const remaining = cardAllocation.magics - addedMagicCount;
    if (remaining <= 0) break;

    const before = selectedSpells.length;
    selectedSpells = (deckOptimizer as any).addCardWithCopies(magic, selectedSpells, remaining, copiesInDeck, avatar);
    addedMagicCount += (selectedSpells.length - before);
  }

  // ENHANCEMENT: Analyze elemental requirements before filling the remaining slots
  const elementalAnalysis = (elementAnalyzer as any).analyzeElementalRequirements(selectedSpells);
  const hasElementDeficiencies = Object.keys(elementalAnalysis.elementDeficiencies || {}).length > 0;

  if (hasElementDeficiencies) {
      // Find cards that could address this elemental deficiency
      const allAvailableCards = [...minions, ...artifacts, ...auras, ...magics]
        .filter((card: Card) => !selectedSpells.some((s: Card) => s.baseName === card.baseName));
        
      const recommendations = (elementAnalyzer as any).getElementalRecommendations(
        allAvailableCards, elementalAnalysis
      );
      
      // Add recommended cards to address elemental deficiencies (up to 5 per element)
      let addedCount = 0;
      for (const card of recommendations) {
        if (addedCount >= 5 || selectedSpells.length >= 60) break;
        
        const elementContribution = (elementAnalyzer as any).calculateElementalDeficitContribution(card, elementalAnalysis);
        if (elementContribution > 0) {
          selectedSpells.push(card);
          copiesInDeck[card.baseName] = (copiesInDeck[card.baseName] || 0) + 1;
          addedCount++;
        }
      }
    }
  }

  // ENHANCEMENT: Fill remaining slots with high-synergy cards
  const targetDeckSize = 55; // Target deck size
  const remainingSlots = Math.max(0, targetDeckSize - selectedSpells.length);
  
  if (remainingSlots > 0) {
    console.log(`Filling ${remainingSlots} remaining slots with high-synergy cards...`);
    
    // Get all available cards not yet in deck
    const availableCards = [...minions, ...artifacts, ...auras, ...magics]
      .filter((card: Card) => !selectedSpells.some((s: Card) => s.baseName === card.baseName));
    
    // Sort by synergy with current deck
    const sortedAvailable = availableCards.sort((a: Card, b: Card) => 
      (synergyCalculator as any).calculateSynergy(b, selectedSpells) - 
      (synergyCalculator as any).calculateSynergy(a, selectedSpells)
    );
    
    for (let i = 0; i < Math.min(remainingSlots, sortedAvailable.length); i++) {
      const card = sortedAvailable[i];
      selectedSpells.push(card);
      copiesInDeck[card.baseName] = (copiesInDeck[card.baseName] || 0) + 1;
    }
  }

  // Optimize the deck
  console.log("Running deck optimization...");
  selectedSpells = (deckOptimizer as any).optimizeDeck(selectedSpells, minions, artifacts, auras, magics, options.preferredArchetype);

  // Calculate final synergy
  const totalSynergy = selectedSpells.reduce((sum: number, card: Card) => 
    sum + (synergyCalculator as any).calculateSynergy(card, selectedSpells), 0
  );

  // Analyze deck playability
  const playabilityAnalysis = (deckPlayability as any).analyzeDeckPlayability(selectedSpells);

  console.log(`Built deck with ${selectedSpells.length} cards, total synergy: ${totalSynergy.toFixed(2)}`);
  console.log(`Playability score: ${playabilityAnalysis.playabilityScore.toFixed(2)}/10`);
  
  return {
    spells: selectedSpells,
    playabilityScore: playabilityAnalysis.playabilityScore,
    playabilityIssues: playabilityAnalysis.issues,
    totalSynergy: totalSynergy,
    copiesInDeck: copiesInDeck // Added this line
  };
}

/**
 * Build a complete deck including sites
 */
export function buildCompleteDeck(options: DeckBuildOptions): Deck {
  const spellbookResult = buildSpellbook(options);
  
  // TODO: Implement site selection logic
  const sites: Card[] = [];
  
  const metadata: DeckMetadata = {
    name: `Generated Deck`,
    description: `Auto-generated deck with ${spellbookResult.spells.length} cards`,
    createdAt: new Date(),
    totalSynergy: spellbookResult.totalSynergy,
    playabilityScore: spellbookResult.playabilityScore
  };

  return {
    avatar: options.avatar,
    spellbook: spellbookResult.spells,
    sites,
    metadata
  };
}
