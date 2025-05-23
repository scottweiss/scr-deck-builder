/**
 * Test Script for Playability-Enhanced Deck Builder
 * 
 * This script demonstrates how our enhanced deck builder
 * creates more playable decks by focusing on having cards to play
 * rather than adhering strictly to ideal mana curves.
 */

import * as deckBuilder from '../core/deck/deckBuilder';
import * as deckPlayability from '../analyses/playability/deckPlayability';
import * as sorceryCards from '../data/processed/sorceryCards';
import { Card, CardType } from '../types/Card';
import { PlayabilityAnalysis, PlayabilityRecommendation } from '../analyses/playability/deckPlayability'; // Import types

interface AllocationStrategy {
    minions: number;
    artifacts: number;
    auras: number;
    magics: number;
}

/**
 * Tests the playability-focused deck builder with different strategies
 */
async function testPlayabilityEnhancedDeckBuilder(): Promise<void> {
    // Load cards
    const betaCards: Card[] = await sorceryCards.getBetaCards() || []; // Typed betaCards
    if (!betaCards.length) {
        console.error("Error loading cards");
        return;
    }
    
    console.log(`Loaded ${betaCards.length} cards from Beta set.`);
    
    // Filter card types
    const minions: Card[] = betaCards.filter((card: Card) => card.type?.toLowerCase() === 'minion');
    const artifacts: Card[] = betaCards.filter((card: Card) => card.type?.toLowerCase() === 'artifact');
    const auras: Card[] = betaCards.filter((card: Card) => card.type?.toLowerCase() === 'aura');
    const magics: Card[] = betaCards.filter((card: Card) => card.type?.toLowerCase() === 'magic');
    
    // Test different allocation strategies
    
    // 1. Aggro Strategy (heavily weighted toward minions)
    console.log("\n\n=================================================");
    console.log("TESTING AGGRO STRATEGY (HEAVY ON MINIONS)");
    console.log("=================================================\n");
    
    const aggroAllocation: AllocationStrategy = {
        minions: 32,  // More minions for aggressive strategy
        artifacts: 6, 
        auras: 2,
        magics: 10
    };
    
    // Filter for aggro-focused cards
    const aggroMinions: Card[] = minions.filter((card: Card) => { // Typed card
        // Prioritize low-cost minions with high power
        if (card.mana_cost != null && card.mana_cost <= 3 && card.power != null && card.power >= 2) return true; // Added null checks
        // Also include cards with aggressive text
        const text = (card.text || "").toLowerCase();
        return text.includes("attack") || text.includes("damage") || text.includes("fast");
    });
    
    await testDeckStrategy("Aggro", aggroAllocation, {
        minions: aggroMinions,
        artifacts,
        auras,
        magics
    });
    
    // 2. Control Strategy (more artifacts and magics)
    console.log("\n\n=================================================");
    console.log("TESTING CONTROL STRATEGY (ARTIFACTS & MAGICS)");
    console.log("=================================================\n");
    
    const controlAllocation: AllocationStrategy = {
        minions: 20,  // Fewer minions
        artifacts: 15, // More artifacts for control
        auras: 5,
        magics: 15    // More removal/control magics
    };
    
    const controlMinions: Card[] = minions.filter((card: Card) => { // Typed card
        // Prioritize defensive minions or high-value cards
        // Assuming life is the defense stat for minions
        return (card.mana_cost != null && card.mana_cost >= 4) || (card.life != null && card.life >= 4); // Added null checks, used life
    });
    
    const controlMagics: Card[] = magics.filter((card: Card) => { // Typed card
        const text = (card.text || "").toLowerCase();
        return text.includes("destroy") || text.includes("remove") || text.includes("draw");
    });
    
    await testDeckStrategy("Control", controlAllocation, {
        minions: controlMinions,
        artifacts,
        auras,
        magics: controlMagics
    });
    
    // 3. Balanced Strategy
    console.log("\n\n=================================================");
    console.log("TESTING BALANCED STRATEGY");
    console.log("=================================================\n");
    
    const balancedAllocation: AllocationStrategy = {
        minions: 25,
        artifacts: 10,
        auras: 5,
        magics: 15
    };
    
    await testDeckStrategy("Balanced", balancedAllocation, {
        minions,
        artifacts,
        auras,
        magics
    });
}

interface DeckFormat { // Define a type for the deck structure
    cards: Card[];
    sites: any[]; // Assuming sites can be any for now, or define a proper type if available
}

async function testDeckStrategy(
    strategyName: string, 
    allocation: AllocationStrategy, 
    cardPools: { minions: Card[]; artifacts: Card[]; auras: Card[]; magics: Card[] } // Typed cardPools
): Promise<void> {
    try {
        console.log(`Building ${strategyName} deck with allocation:`, allocation);
        
        // Build deck using the enhanced builder
        const deck: DeckFormat = await buildDeckWithAllocation(allocation, cardPools); // Typed deck
        
        if (!deck || !deck.cards || deck.cards.length === 0) {
            console.error(`Failed to build ${strategyName} deck - no cards selected`);
            return;
        }
        
        console.log(`\n${strategyName} Deck Built Successfully!`);
        console.log(`Total Cards: ${deck.cards.length}`);
        
        // Analyze playability
        const playabilityAnalysis: PlayabilityAnalysis = deckPlayability.analyzeDeckPlayability(deck.cards); // Removed await, pass deck.cards
        const recommendations: PlayabilityRecommendation[] = deckPlayability.getPlayabilityRecommendations(deck.cards); // Removed await, pass deck.cards
        
        console.log(`\nPlayability Analysis for ${strategyName}:`);
        console.log(`Overall Score: ${(playabilityAnalysis.playabilityScore / 10).toFixed(1)}/10`); // Used playabilityScore, adjusted scale
        
        // Comment out turnPlayability as it's not in PlayabilityAnalysis
        // console.log(`Turn 1 Playable: ${playabilityAnalysis.turnPlayability[1]?.percentage.toFixed(1) || 0}%`);
        // console.log(`Turn 2 Playable: ${playabilityAnalysis.turnPlayability[2]?.percentage.toFixed(1) || 0}%`);
        // console.log(`Turn 3 Playable: ${playabilityAnalysis.turnPlayability[3]?.percentage.toFixed(1) || 0}%`);
        // Instead, log phase scores:
        console.log(`Early Game Score: ${playabilityAnalysis.earlyGame.score.toFixed(0)}/100 (${playabilityAnalysis.earlyGame.cards} cards)`);
        console.log(`Mid Game Score: ${playabilityAnalysis.midGame.score.toFixed(0)}/100 (${playabilityAnalysis.midGame.cards} cards)`);
        console.log(`Late Game Score: ${playabilityAnalysis.lateGame.score.toFixed(0)}/100 (${playabilityAnalysis.lateGame.cards} cards)`);
        
        // Show mana curve
        console.log(`\nMana Curve:`);
        // Use manaCurve from playabilityAnalysis
        for (let cost = 0; cost <= 7; cost++) { // Max cost in manaCurve from deckPlayability is 7
            const count = playabilityAnalysis.manaCurve[cost] || 0;
            console.log(`  ${cost} mana: ${count} cards`);
        }
        
        // Show recommendations
        if (recommendations && recommendations.length > 0) {
            console.log(`\nRecommendations:`);
            recommendations.slice(0, 3).forEach((rec: PlayabilityRecommendation, index: number) => { // Used PlayabilityRecommendation type
                console.log(`  ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.suggestion}`); // Used rec.suggestion, added category/priority
            });
        }
        
        console.log("\n" + "=".repeat(50));
        
    } catch (error: any) {
        console.error(`Error testing ${strategyName} strategy:`, error.message);
    }
}

async function buildDeckWithAllocation(
    allocation: AllocationStrategy, 
    cardPools: { minions: Card[]; artifacts: Card[]; auras: Card[]; magics: Card[] } // Typed cardPools
): Promise<DeckFormat> { // Return DeckFormat
    const selectedCards: Card[] = []; // Typed selectedCards
    
    // Select cards for each type based on allocation
    selectedCards.push(...selectCards(cardPools.minions, allocation.minions));
    selectedCards.push(...selectCards(cardPools.artifacts, allocation.artifacts));
    selectedCards.push(...selectCards(cardPools.auras, allocation.auras));
    selectedCards.push(...selectCards(cardPools.magics, allocation.magics));
    
    return {
        cards: selectedCards,
        sites: [] // Add sites if needed
    };
}

function selectCards(cardPool: Card[], count: number): Card[] { // Typed cardPool and return type
    if (!cardPool || cardPool.length === 0) return [];
    
    // Sort by playability factors (low cost first, then by power/utility)
    const sortedCards = cardPool.sort((a: Card, b: Card) => { // Typed a and b
        // Priority: lower mana cost, higher power
        if (a.mana_cost != null && b.mana_cost != null && a.mana_cost !== b.mana_cost) { // Added null checks
            return a.mana_cost - b.mana_cost;
        }
        // Ensure power is not null before comparing
        const powerA = a.power || 0;
        const powerB = b.power || 0;
        return powerB - powerA;
    });
    
    return sortedCards.slice(0, Math.min(count, sortedCards.length));
}

// Removed calculateManaCurve function as it's redundant

// Run the test
testPlayabilityEnhancedDeckBuilder().catch((error: any) => {
    console.error('Test failed:', error);
    process.exit(1);
});
