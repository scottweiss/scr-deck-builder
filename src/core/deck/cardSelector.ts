import { Card } from '../../types/Card';
import { SYSTEM_MODE } from '../../config';
import { calculateSynergy } from '../../analyses/synergy/synergyCalculator';
import { identifyCardMechanics, canIncludeWithAvatar, evaluateRegionalStrategy } from '../cards/cardAnalysis';
import { analyzeElementalRequirements, calculateElementalDeficitContribution } from '../../analyses/position/elementRequirementAnalyzer';
import { getMaxCopiesForRarity } from './allocation/rarityManager';
import { debugElementalThresholds } from '../simulation/metaTester';
import { getCardThreshold } from '../../utils/utils'; // Added import

/**
 * Find candidate cards of a specific mana cost
 * @param allCandidates Available cards to choose from
 * @param adjustedCost Target mana cost
 * @param currentDeck Current deck composition
 * @param adjustment Number of cards needed
 * @returns Filtered candidate cards
 */
export function findCandidatesOfCost(
    allCandidates: Card[],
    adjustedCost: number,
    currentDeck: Card[],
    adjustment: number
): Card[] {
    // Find candidates of this cost that aren't already in the deck
    let candidates = allCandidates
        .filter(card => Math.min(card.mana_cost || 0, 7) === adjustedCost &&
            !currentDeck.some(c => (c.baseName || c.name) === (card.baseName || card.name)) &&
            canIncludeWithAvatar(card, null));
    
    // For critical early game mana costs with few options,
    // also consider cards that can provide card advantage or have flexibility
    if (candidates.length < adjustment && adjustedCost <= 2) {
        console.log(`Few ${adjustedCost}-cost cards available (${candidates.length}), looking for flexible alternatives`);
        
        // Look for cards with flexible mana costs, card draw, or cycling
        const flexibleCandidates = allCandidates
            .filter(card => {
                // Don't duplicate candidates we already have
                if (candidates.some(c => (c.baseName || c.name) === (card.baseName || card.name))) return false;
                
                // Don't include cards we already have in the deck
                if (currentDeck.some(c => (c.baseName || c.name) === (card.baseName || card.name))) return false;
                
                // Don't include cards that are much more expensive
                if ((card.mana_cost || 0) > adjustedCost + 1) return false;
                
                const text = (card.text || '').toLowerCase();
                // Cards that provide card advantage or flexibility
                return (text.includes('draw a card') || 
                       text.includes('cycle') ||
                       text.includes('search your') ||
                       text.includes('alternative cost') ||
                       text.includes('instead of paying')) &&
                       canIncludeWithAvatar(card, null);
            });
            
        if (flexibleCandidates.length > 0) {
            console.log(`Found ${flexibleCandidates.length} flexible alternative cards`);
            candidates = [...candidates, ...flexibleCandidates];
        }
    }
    
    return candidates;
}

/**
 * Sort cards by their strategic value for the deck
 * @param candidates Cards to sort
 * @param currentDeck Current deck composition
 * @returns Sorted cards (best first)
 */
export function sortCardsByStrategicValue(candidates: Card[], currentDeck: Card[], sites: Card[] = []): Card[] {
    // Debugging elemental thresholds before analysis
    if (SYSTEM_MODE.DEBUG) {
        if (currentDeck && currentDeck.length > 0) {
            console.log("Debugging elemental thresholds for currentDeck in sortCardsByStrategicValue (using getCardThreshold):");
            debugElementalThresholds(currentDeck, getCardThreshold); // Corrected call
        }
        if (candidates && candidates.length > 0) {
            console.log("Debugging elemental thresholds for candidates in sortCardsByStrategicValue (using getCardThreshold):");
            debugElementalThresholds(candidates, getCardThreshold); // Corrected call
        }
    }

    return candidates.sort((a, b) => {
        const aSynergy = calculateSynergy(a, currentDeck);
        const bSynergy = calculateSynergy(b, currentDeck);
        
        // Consider card power and utility for the cost
        const aPowerValue = (a.power || 0) / Math.max(a.mana_cost || 1, 1);
        const bPowerValue = (b.power || 0) / Math.max(b.mana_cost || 1, 1);
        
        // Consider elemental deficiency contribution
        const elementalAnalysis = analyzeElementalRequirements(currentDeck, sites); // Pass provided sites for proper elemental affinity
        const aElementalScore = calculateElementalDeficitContribution(a, elementalAnalysis) * 2; // Higher weight
        const bElementalScore = calculateElementalDeficitContribution(b, elementalAnalysis) * 2;
        
        // Consider positional strategy matching
        const deckStrategy = evaluateRegionalStrategy(currentDeck);
        let aPositionalScore = 0;
        let bPositionalScore = 0;
        
        if (deckStrategy !== "mixed") {
            const aMechanics = identifyCardMechanics(a);
            const bMechanics = identifyCardMechanics(b);
            
            // Assign positional strategy scores
            if (deckStrategy === "underground" && aMechanics.operatesUnderground) aPositionalScore = 10;
            if (deckStrategy === "underwater" && aMechanics.operatesUnderwater) aPositionalScore = 10;
            if (deckStrategy === "airborne" && (a.text || "").toLowerCase().includes("airborne")) aPositionalScore = 10;
            
            if (deckStrategy === "underground" && bMechanics.operatesUnderground) bPositionalScore = 10;
            if (deckStrategy === "underwater" && bMechanics.operatesUnderwater) bPositionalScore = 10;
            if (deckStrategy === "airborne" && (b.text || "").toLowerCase().includes("airborne")) bPositionalScore = 10;
        }
        
        // Combine all factors with appropriate weights
        const aTotal = aSynergy + aPowerValue + aElementalScore + aPositionalScore;
        const bTotal = bSynergy + bPowerValue + bElementalScore + bPositionalScore;
        
        return bTotal - aTotal;
    });
}

/**
 * Sort cards by strategic priority for regional strategies
 * @param candidates Available cards
 * @param currentDeck Current deck composition
 * @param strategy Regional strategy to prioritize
 * @param sites Optional sites to use for elemental analysis
 * @returns Sorted cards
 */
export function sortCardsByRegionalStrategy(
    candidates: Card[],
    currentDeck: Card[],
    strategy: string,
    sites: Card[] = []
): Card[] {
    if (strategy === "mixed") {
        return candidates;
    }

    return candidates.sort((a, b) => {
        const aMechanics = identifyCardMechanics(a);
        const bMechanics = identifyCardMechanics(b);

        // Get relevant operation flags based on strategy
        const aMatches = strategy === "underground" ? aMechanics.operatesUnderground : 
                       (strategy === "underwater" ? aMechanics.operatesUnderwater :
                       (strategy === "airborne" ? (a.text || "").toLowerCase().includes("airborne") : false));
                       
        const bMatches = strategy === "underground" ? bMechanics.operatesUnderground : 
                       (strategy === "underwater" ? bMechanics.operatesUnderwater :
                       (strategy === "airborne" ? (b.text || "").toLowerCase().includes("airborne") : false));
        
        // Prioritize matching cards
        if (aMatches !== bMatches) return bMatches ? 1 : -1;
        
        // Fall back to synergy sorting
        return calculateSynergy(b, currentDeck) - calculateSynergy(a, currentDeck);
    });
}

/**
 * Add selected cards to deck while respecting rarity limits
 * @param candidates Cards to potentially add
 * @param deck Current deck
 * @param maxToAdd Maximum number of cards to add
 * @returns Updated deck
 */
export function addCardsRespectingRarity(
    candidates: Card[],
    deck: Card[],
    maxToAdd: number
): Card[] {
    const updatedDeck = [...deck];
    let added = 0;

    for (const candidate of candidates) {
        if (added >= maxToAdd || updatedDeck.length >= 50) break;

        const baseName = candidate.baseName || candidate.name || '';
        const rarity = candidate.rarity;

        // Count how many of this card we already have
        const currentCount = updatedDeck.filter(c => (c.baseName || c.name) === baseName).length;
        const maxCopies = getMaxCopiesForRarity(rarity);

        // Only add if we haven't hit the limit
        if (currentCount < maxCopies) {
            updatedDeck.push(candidate);
            added++;
        }
    }

    return updatedDeck;
}

/**
 * Remove cards from deck based on strategic criteria
 * @param deck Current deck
 * @param cardsToRemove Number of cards to remove at specific cost
 * @param targetCost Mana cost to target for removal
 * @param combos Known combo information
 * @returns Updated deck with cards removed
 */
export function removeCardsStrategically(
    deck: Card[],
    cardsToRemove: number,
    targetCost: number,
    combos: any[]
): Card[] {
    const adjustedCost = Math.min(targetCost, 7);
    const cardsOfCost = deck
        .map((card, index) => ({ index, card }))
        .filter(item => Math.min(item.card.mana_cost || 0, 7) === adjustedCost);

    if (cardsOfCost.length === 0) return deck;

    // Sort cards by removal priority (remove worst cards first)
    const cardsToRemoveList = cardsOfCost
        .sort((a, b) => {
            // Preserve key combo pieces regardless of other factors
            const aIsCombo = combos.some((combo: any) => 
                combo.cards.some((cardName: string) => cardName.toLowerCase() === a.card.baseName.toLowerCase()));
            const bIsCombo = combos.some((combo: any) => 
                combo.cards.some((cardName: string) => cardName.toLowerCase() === b.card.baseName.toLowerCase()));
            
            if (aIsCombo && !bIsCombo) return 1; // Keep combo pieces
            if (!aIsCombo && bIsCombo) return -1;
            
            // Preserve higher rarity cards
            const aRarity = (a.card.rarity || '').toLowerCase();
            const bRarity = (b.card.rarity || '').toLowerCase();
            const rarityWeight: Record<string, number> = {unique: 4, elite: 3, exceptional: 2, ordinary: 1};
            const aWeight = rarityWeight[aRarity] || 1;
            const bWeight = rarityWeight[bRarity] || 1;
            
            if (aWeight !== bWeight) {
                return aWeight - bWeight; // Remove lower rarity first
            }
            
            // Compare synergy last
            return calculateSynergy(a.card, deck) - calculateSynergy(b.card, deck);
        })
        .slice(0, Math.min(Math.abs(cardsToRemove), Math.floor(cardsOfCost.length / 3))) // Only remove up to 1/3 of cards
        .map(item => item.index);

    // Remove from highest index to lowest to avoid index shifting
    const updatedDeck = [...deck];
    for (const index of cardsToRemoveList.sort((a, b) => b - a)) {
        updatedDeck.splice(index, 1);
    }

    return updatedDeck;
}
