import { Card, CardAllocation, Element } from '../../../types/Card';
import { DeckBuildOptions, Deck, DeckMetadata } from '../../../types/Deck';
import * as synergyCalculator from '../../../analyses/synergy/synergyCalculator';
import * as deckOptimizer from '../optimization/deckOptimizer';
import * as elementAnalyzer from '../../../analyses/position/elementRequirementAnalyzer';
import * as deckPlayability from '../../../analyses/playability/deckPlayability';
import { calculateCardAllocation } from '../allocation/cardAllocation';
import { analyzeCardCombos } from '../analysis/comboDetection';
import { isUtilityArtifact, sortArtifactsWithUtilityPriority } from '../allocation/utilityArtifactPrioritizer';
import { Combo } from '../../cards/cardCombos';

import { completeDeckWithSynergyCards, addElementalFixingCards } from './deckCompletion';
import { isComboCard, sortMinions, sortAuras, sortMagics } from './cardSorting';
import { selectMinions, selectAuras, selectMagics } from './cardSelection';

// Re-export functions for backward compatibility
export { calculateCardAllocation } from '../allocation/cardAllocation';
export { analyzeCardCombos } from '../analysis/comboDetection';
export { isUtilityArtifact, sortArtifactsWithUtilityPriority } from '../allocation/utilityArtifactPrioritizer';
export { completeDeckWithSynergyCards, addElementalFixingCards } from './deckCompletion';
export { isComboCard, sortMinions, sortAuras, sortMagics } from './cardSorting';
export { selectMinions, selectAuras, selectMagics } from './cardSelection';

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
    allocation = {} as CardAllocation,
    sites = [] // Extract sites, default to empty array if not provided
  } = options;

  // Set default allocations if not provided
  const defaultAllocation: CardAllocation = {
    minions: 24,  // ~45%
    artifacts: 10, // ~20%
    auras: 6,     // ~12%
    magics: 15,   // ~30%
  };
  
  let selectedSpells: Card[] = [];
  const copiesInDeck: Record<string, number> = {};
  
  // Start with default or provided allocations  
  let finalAllocation = {
    minions: allocation.minions ?? defaultAllocation.minions,
    artifacts: allocation.artifacts ?? defaultAllocation.artifacts,
    auras: allocation.auras ?? defaultAllocation.auras,
    magics: allocation.magics ?? defaultAllocation.magics,
  };

  // Identify available combos in the card pool and adjust allocations
  const comboAnalysis = analyzeCardCombos(minions, artifacts, auras, magics, uniqueCards);
  const { availableCombos, comboPieces, hasUtilityCombo } = comboAnalysis;
  
  // Calculate card allocation based on combo analysis
  const allocationResult = calculateCardAllocation(availableCombos, finalAllocation);
  const cardAllocation: CardAllocation = allocationResult.allocation;
  
  if (allocationResult.adjustmentReason) {
    console.log(allocationResult.adjustmentReason);
  }

  // Add minions
  const sortedMinions = sortMinions(
    minions, 
    selectedSpells, 
    comboPieces, 
    (synergyCalculator as any).calculateSynergy
  );

  const minionResult = selectMinions(
    sortedMinions,
    selectedSpells,
    cardAllocation.minions,
    copiesInDeck,
    (deckOptimizer as any).addCardWithCopies,
    avatar
  );
  selectedSpells = minionResult.updatedDeck;

  // Add artifacts with utility prioritization
  console.log(`Selecting ${cardAllocation.artifacts} artifacts...`);
  
  const sortedArtifacts = sortArtifactsWithUtilityPriority(
    artifacts, 
    selectedSpells, 
    hasUtilityCombo,
    comboPieces,
    (synergyCalculator as any).calculateSynergy
  );

  let addedArtifactCount = 0;
  for (const artifact of sortedArtifacts) {
    const remaining = cardAllocation.artifacts - addedArtifactCount;
    if (remaining <= 0) break;

    const before = selectedSpells.length;
    selectedSpells = (deckOptimizer as any).addCardWithCopies(artifact, selectedSpells, remaining, copiesInDeck, avatar);
    addedArtifactCount += (selectedSpells.length - before);
  }

  // Add auras
  const sortedAuras = sortAuras(
    auras, 
    selectedSpells, 
    comboPieces, 
    (synergyCalculator as any).calculateSynergy
  );

  const auraResult = selectAuras(
    sortedAuras,
    selectedSpells,
    cardAllocation.auras,
    copiesInDeck,
    (deckOptimizer as any).addCardWithCopies,
    avatar
  );
  selectedSpells = auraResult.updatedDeck;

  // Add magic spells
  const sortedMagics = sortMagics(
    magics, 
    selectedSpells, 
    comboPieces, 
    (synergyCalculator as any).calculateSynergy
  );

  const magicResult = selectMagics(
    sortedMagics,
    selectedSpells,
    cardAllocation.magics,
    copiesInDeck,
    (deckOptimizer as any).addCardWithCopies,
    avatar
  );
  selectedSpells = magicResult.updatedDeck;

  // ENHANCEMENT: Analyze elemental requirements and add fixing cards if needed
  const elementalAnalysis = (elementAnalyzer as any).analyzeElementalRequirements(selectedSpells, sites); // Pass actual sites to calculate elemental affinity
  const hasElementDeficiencies = Object.keys(elementalAnalysis.elementDeficiencies || {}).length > 0;

  if (hasElementDeficiencies) {
    // Find cards that could address this elemental deficiency
    const allAvailableCards = [...minions, ...artifacts, ...auras, ...magics]
      .filter((card: Card) => !selectedSpells.some((s: Card) => s.baseName === card.baseName));
      
    const recommendations = (elementAnalyzer as any).getElementalRecommendations(
      allAvailableCards, elementalAnalysis
    );
    
    // Add recommended cards using the modular function
    const elementalResult = addElementalFixingCards(
      selectedSpells, 
      recommendations, 
      elementalAnalysis,
      copiesInDeck,
      (elementAnalyzer as any).calculateElementalDeficitContribution
    );
    
    selectedSpells = elementalResult.updatedDeck;
    Object.assign(copiesInDeck, elementalResult.updatedCopies);
  }

  // ENHANCEMENT: Fill remaining slots with high-synergy cards
  const targetDeckSize = 55; // Target deck size
  const allAvailableCards = [...minions, ...artifacts, ...auras, ...magics];
  
  const completionResult = completeDeckWithSynergyCards({
    selectedSpells,
    allAvailableCards,
    targetDeckSize,
    copiesInDeck,
    calculateSynergy: (synergyCalculator as any).calculateSynergy
  });
  
  selectedSpells = completionResult.completedDeck;
  Object.assign(copiesInDeck, completionResult.copiesInDeck);

  // Optimize the deck
  console.log("Running deck optimization...");
  selectedSpells = (deckOptimizer as any).optimizeDeck(selectedSpells, minions, artifacts, auras, magics, options.preferredArchetype, sites);

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
  
  // Use provided sites or default to empty array
  const sites: Card[] = options.sites || [];
  
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

/**
 * DeckBuilder object containing all deck building functions
 */
export const DeckBuilder = {
  buildSpellbook,
  buildCompleteDeck
};
