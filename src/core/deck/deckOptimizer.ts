import { calculateSynergy } from '../../analyses/synergy/synergyCalculator';
import { identifyCardMechanics, canIncludeWithAvatar, evaluateRegionalStrategy } from '../cards/cardAnalysis';
import { analyzeElementalRequirements, calculateElementalDeficitContribution } from '../../analyses/position/elementRequirementAnalyzer';
import { Card, CardRarity } from '../../types/Card';

/**
 * Interface for tracking card copies in deck
 */
interface CopiesInDeck {
    [baseName: string]: number;
}

/**
 * Interface for mana curve adjustments
 */
interface ManaCurveAdjustments {
    [manaCost: string]: number;
}

/**
 * Interface for ideal mana curve distribution
 */
interface IdealManaCurve {
    [manaCost: number]: number;
}

/**
 * Interface for mana cost distribution
 */
interface ManaCostDistribution {
    [manaCost: number]: number;
}

/**
 * Interface for critical mana cost requirements
 */
interface CriticalManaCosts {
    [manaCost: number]: number;
}

/**
 * Get maximum allowed copies for a card based on its rarity
 * @param rarity The rarity string
 * @returns Maximum number of copies allowed
 */
export function getMaxCopiesForRarity(rarity: string | undefined): number {
    const rarityLower = (rarity || "").toLowerCase();
    if (rarityLower.includes("unique")) return 1;
    if (rarityLower.includes("elite")) return 2;
    if (rarityLower.includes("exceptional")) return 3;
    return 4; // Default for ordinary cards
}

/**
 * Add cards to deck with copy restrictions
 * @param card Card to add
 * @param deck Current deck
 * @param maxCardsToAdd Maximum number of this card to add
 * @param copiesInDeck Current copy tracking
 * @param selectedAvatar Avatar for compatibility checking
 * @returns Updated deck
 */
export function addCardWithCopies(
    card: Card | null,
    deck: Card[],
    maxCardsToAdd: number,
    copiesInDeck: CopiesInDeck,
    selectedAvatar: Card | null
): Card[] {
    if (!card || deck.length >= 50) return deck;

    // Check avatar restrictions
    if (!canIncludeWithAvatar(card, selectedAvatar)) {
        return deck; // Skip this card if it doesn't work with our avatar
    }

    const baseName = card.baseName || card.name || '';
    const rarity = card.rarity;

    // Initialize counter if this is the first time seeing this card
    if (!copiesInDeck[baseName]) {
        copiesInDeck[baseName] = 0;
    }

    // Determine maximum allowed copies based on rarity
    const maxCopies = getMaxCopiesForRarity(rarity);

    // Add up to the allowed number of copies
    const copiesToAdd = Math.min(
        maxCopies - copiesInDeck[baseName], // How many more can we add based on rarity
        maxCardsToAdd, // How many we want to add
        50 - deck.length // How many we can add before hitting 50 cards
    );

    for (let i = 0; i < copiesToAdd; i++) {
        // Add a copy of the card (using a clone to avoid reference issues)
        deck.push({ ...card });
        copiesInDeck[baseName]++;
    }

    return deck;
}

/**
 * Enforce rarity limits on a collection of cards
 * @param cards Cards to filter
 * @returns Filtered cards respecting rarity limits
 */
export function enforceRarityLimits(cards: Card[]): Card[] {
    const result: Card[] = [];
    const countByName: Record<string, number> = {};

    for (const card of cards) {
        const baseName = card.baseName || card.name || '';
        const rarity = card.rarity;

        // Initialize counter if this is the first time seeing this card
        if (!countByName[baseName]) {
            countByName[baseName] = 0;
        }

        // Determine maximum allowed copies based on rarity
        const maxCopies = getMaxCopiesForRarity(rarity);

        // Add card if we haven't hit the limit
        if (countByName[baseName] < maxCopies) {
            result.push(card);
            countByName[baseName]++;
        }
    }

    return result;
}

/**
 * Optimize a deck based on various strategic factors
 * @param selectedSpells Current spell selection
 * @param minions Available minions
 * @param artifacts Available artifacts
 * @param auras Available auras
 * @param magics Available magics
 * @param preferredArchetype Optional preferred archetype to optimize for
 * @returns Optimized deck
 */
export function optimizeDeck(
    selectedSpells: Card[],
    minions: Card[],
    artifacts: Card[],
    auras: Card[],
    magics: Card[],
    preferredArchetype?: string
): Card[] {
    // Get synergy calculator and card combo system
    const synergyCalculator = require('../../analyses/synergy/synergyCalculator');
    const cardCombos = require('../cards/cardCombos');
    
    // ENHANCEMENT: Analyze elemental requirements first
    console.log("Analyzing elemental requirements and thresholds...");
    const elementalAnalysis = analyzeElementalRequirements(selectedSpells);
    const hasElementDeficiencies = Object.keys(elementalAnalysis.elementDeficiencies || {}).length > 0;
    
    if (hasElementDeficiencies) {
        console.log("Elemental threshold requirements need optimization:");
        for (const [element, info] of Object.entries(elementalAnalysis.elementDeficiencies)) {
            console.log(`- ${element}: ${info.current}/${info.required} (deficit: ${info.deficit})`);
        }
    } else {
        console.log("Elemental thresholds are satisfactory.");
    }
    
    // Analyze the current deck for combos and archetypes
    const deckAnalysis = synergyCalculator.getDeckAnalysis(selectedSpells);
    const combos = deckAnalysis.combos;
    const archetypes = deckAnalysis.archetypes;
    
    // Determine the primary elements and archetypes with enhanced weighting
    const elementFrequency: Record<string, number> = {};
    for (const card of selectedSpells) {
        (card.elements || []).forEach(element => {
            // Weight elements by card impact (mana cost can be a proxy for importance)
            const weight = 1 + (card.mana_cost || 0) * 0.1;
            elementFrequency[element] = (elementFrequency[element] || 0) + weight;
        });
    }
    
    const sortedElements = Object.entries(elementFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    
    const primaryElement = sortedElements[0];
    
    // Get the top archetypes
    const topArchetypes = Object.entries(archetypes)
        .sort((a: [string, unknown], b: [string, unknown]) => (b[1] as number) - (a[1] as number))
        .filter((entry: [string, unknown]) => (entry[1] as number) > 1)
        .map((entry: [string, unknown]) => entry[0]);
    
    // Adjust mana curve based on archetype
    let idealCurve: IdealManaCurve;
    
    // Use the preferred archetype if specified, otherwise use the detected one
    const primaryArchetype = preferredArchetype || (topArchetypes.length > 0 ? topArchetypes[0] : null);
    
    if (primaryArchetype) {
        
        // Customize mana curve based on the archetype
        if (primaryArchetype === "Aggro") {
            idealCurve = {
                0: 0.05,  // 5% - More 0-cost for aggro
                1: 0.20,  // 20% - Heavy early presence
                2: 0.25,  // 25% - Core curve for aggro
                3: 0.25,  // 25% - Mid-curve peak
                4: 0.15,  // 15% - Fewer high-cost cards
                5: 0.06,  // 6% - Limited top-end
                6: 0.03,  // 3% - Very few finishers
                7: 0.01   // 1% - Almost no ultra-high cost
            };
            console.log("Optimizing for Aggro archetype - favoring lower-cost cards");
        }
        else if (primaryArchetype === "Control") {
            idealCurve = {
                0: 0.03,  // 3% - Fewer 0-cost (utility only)
                1: 0.10,  // 10% - Early defense
                2: 0.15,  // 15% - Early control tools
                3: 0.20,  // 20% - Core control cards
                4: 0.22,  // 22% - Primary control zone
                5: 0.15,  // 15% - Strong late-game
                6: 0.10,  // 10% - More finishers
                7: 0.05   // 5% - Game-ending threats
            };
            console.log("Optimizing for Control archetype - favoring mid-to-high cost cards");
        }
        else if (primaryArchetype.includes("Synergy") || primaryArchetype === "Combo") {
            idealCurve = {
                0: 0.06,  // 6% - More combo pieces
                1: 0.14,  // 14% - Setup cards
                2: 0.22,  // 22% - Core combo pieces
                3: 0.22,  // 22% - Combo development
                4: 0.18,  // 18% - Mid-game power
                5: 0.10,  // 10% - Combo finishers
                6: 0.05,  // 5% - High impact cards
                7: 0.03   // 3% - Ultimate finishers
            };
            console.log(`Optimizing for ${primaryArchetype} archetype - balancing combo pieces`);
        }
        else {
            // Default balanced curve
            idealCurve = {
                0: 0.04,  // 4% - Very few 0-cost cards
                1: 0.12,  // 12% - Early game presence
                2: 0.20,  // 20% - Core early-mid game
                3: 0.24,  // 24% - Peak efficiency zone
                4: 0.18,  // 18% - Mid-game power
                5: 0.12,  // 12% - Late game threats
                6: 0.06,  // 6% - High-impact finishers
                7: 0.04   // 4% - Game-ending spells
            };
            console.log(`Optimizing for ${primaryArchetype} archetype - using balanced curve`);
        }
    } else {
        // Default balanced curve
        idealCurve = {
            0: 0.04,  // 4% - Very few 0-cost cards
            1: 0.12,  // 12% - Early game presence
            2: 0.20,  // 20% - Core early-mid game
            3: 0.24,  // 24% - Peak efficiency zone
            4: 0.18,  // 18% - Mid-game power
            5: 0.12,  // 12% - Late game threats
            6: 0.06,  // 6% - High-impact finishers
            7: 0.04   // 4% - Game-ending spells
        };
    }

    // Current mana curve
    const manaCosts = selectedSpells.map(card => card.mana_cost || 0);
    const currentCurve: ManaCostDistribution = {};
    manaCosts.forEach(cost => {
        const adjustedCost = Math.min(cost, 7); // Cap at 7+ for analysis
        currentCurve[adjustedCost] = (currentCurve[adjustedCost] || 0) + 1;
    });

    // ENHANCEMENT: Analyze playability over ideal curve
    console.log("Analyzing deck playability by mana cost...");
    
    // Ensure minimum playable cards at each critical mana value
    const criticalManaCosts: CriticalManaCosts = {
        0: 1,  // At least 1 zero-cost card
        1: 5,  // At least 5 one-drops
        2: 6,  // At least 6 two-drops
        3: 6,  // At least 6 three-drops
        4: 5,  // At least 5 four-drops
        5: 3,  // At least 3 five-drops
        6: 2,  // At least 2 six-drops
        7: 1   // At least 1 seven-drop
    };
    
    // Calculate actual adjustments based on playability first, then curve
    const totalCards = 50;
    const adjustments: ManaCurveAdjustments = {};
    
    // First, ensure we have minimum playable cards at each mana cost
    for (const [cost, minCount] of Object.entries(criticalManaCosts)) {
        const currentCount = currentCurve[parseInt(cost)] || 0;
        // If we have less than minimum, prioritize adding cards at this cost
        if (currentCount < minCount) {
            adjustments[cost] = minCount - currentCount;
            console.log(`Need ${adjustments[cost]} more ${cost}-cost cards for playability`);
        }
        // If we have more than 1.5x minimum, consider removing some (but not aggressively)
        else if (currentCount > minCount * 1.5 && currentCount > 5) {
            // Only remove excess cards if we have a lot more than needed
            const excessCount = currentCount - Math.ceil(minCount * 1.5);
            // Be conservative - only remove at most half of excess
            adjustments[cost] = -Math.floor(excessCount / 2);
            console.log(`Can potentially remove up to ${Math.abs(adjustments[cost])} ${cost}-cost cards`);
        } 
        // Otherwise, the count is good for playability
        else {
            adjustments[cost] = 0;
        }
    }
    
    // Make adjustments with playability focus
    let optimizedSpells = [...selectedSpells];

    // Remove cards only from severely overcrowded costs
    for (const [cost, adjustment] of Object.entries(adjustments)) {
        if (adjustment < 0) {
            const adjustedCost = Math.min(parseInt(cost), 7);
            const cardsOfCost = optimizedSpells
                .map((card, index) => ({ index, card }))
                .filter(item => Math.min(item.card.mana_cost || 0, 7) === adjustedCost);

            if (cardsOfCost.length > 0) {
                // Only remove cards if we have significantly more than needed
                // Be more conservative with removals - only target least synergistic cards
                const cardsToRemove = cardsOfCost
                    .sort((a, b) => {
                        // Preserve key combo pieces regardless of other factors
                        const aIsCombo = combos.some((combo: any) => 
                            combo.pieces.some((piece: any) => piece.card.baseName === a.card.baseName));
                        const bIsCombo = combos.some((combo: any) => 
                            combo.pieces.some((piece: any) => piece.card.baseName === b.card.baseName));
                        
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
                        return calculateSynergy(a.card, optimizedSpells) - calculateSynergy(b.card, optimizedSpells);
                    })
                    .slice(0, Math.min(Math.abs(adjustment), Math.floor(cardsOfCost.length / 3))) // Only remove up to 1/3 of cards
                    .map(item => item.index);

                // Remove from highest index to lowest to avoid index shifting
                for (const index of cardsToRemove.sort((a, b) => b - a)) {
                    optimizedSpells.splice(index, 1);
                }
            }
        }
    }

    // ENHANCEMENT: Prioritize adding cards to ensure playability first
    const allCandidates = [...minions, ...artifacts, ...auras, ...magics];

    // Sort costs by priority (lower costs first to ensure you have playable cards)
    const priorityCosts = Object.entries(adjustments)
        .filter(([_, adj]) => adj > 0)
        .sort((a, b) => {
            // Prioritize early drops (costs 0-3) first
            const costA = parseInt(a[0]);
            const costB = parseInt(b[0]);
            
            // Critical early game cards get highest priority
            if (costA <= 3 && costB > 3) return -1;
            if (costB <= 3 && costA > 3) return 1;
            
            // Otherwise sort by cost (cheaper first)
            return costA - costB;
        });
    
    console.log("Adding cards in priority order:", priorityCosts.map(c => c[0]).join(", "));
    
    // Process each cost in priority order
    for (const [cost, adjustment] of priorityCosts) {
        const adjustedCost = Math.min(parseInt(cost), 7);
        
        // Find candidates of this cost that aren't already in the deck
        let candidates = allCandidates
            .filter(card => Math.min(card.mana_cost || 0, 7) === adjustedCost &&
                !optimizedSpells.some(c => (c.baseName || c.name) === (card.baseName || card.name)) &&
                canIncludeWithAvatar(card, null));
        
        // ENHANCEMENT: For critical early game mana costs with few options,
        // also consider cards that can provide card advantage or have flexibility
        if (candidates.length < adjustment && parseInt(cost) <= 2) {
            console.log(`Few ${cost}-cost cards available (${candidates.length}), looking for flexible alternatives`);
            
            // Look for cards with flexible mana costs, card draw, or cycling
            const flexibleCandidates = allCandidates
                .filter(card => {
                    // Don't duplicate candidates we already have
                    if (candidates.some(c => (c.baseName || c.name) === (card.baseName || card.name))) return false;
                    
                    // Don't include cards we already have in the deck
                    if (optimizedSpells.some(c => (c.baseName || c.name) === (card.baseName || card.name))) return false;
                    
                    // Don't include cards that are much more expensive
                    if ((card.mana_cost || 0) > parseInt(cost) + 1) return false;
                    
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

        // Sort by synergy, strategic value, and elemental/positional requirements
        candidates.sort((a, b) => {
            const aSynergy = calculateSynergy(a, optimizedSpells);
            const bSynergy = calculateSynergy(b, optimizedSpells);
            
            // Consider card power and utility for the cost
            const aPowerValue = (a.power || 0) / Math.max(a.mana_cost || 1, 1);
            const bPowerValue = (b.power || 0) / Math.max(b.mana_cost || 1, 1);
            
            // ENHANCEMENT: Consider elemental deficiency contribution
            const elementalAnalysis = analyzeElementalRequirements(optimizedSpells);
            const aElementalScore = calculateElementalDeficitContribution(a, elementalAnalysis) * 2; // Higher weight
            const bElementalScore = calculateElementalDeficitContribution(b, elementalAnalysis) * 2;
            
            // ENHANCEMENT: Consider positional strategy matching
            const deckStrategy = evaluateRegionalStrategy(optimizedSpells);
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

        // Add the best candidates while respecting rarity limits
        for (const candidate of candidates.slice(0, adjustment)) {
            const baseName = candidate.baseName || candidate.name || '';
            const rarity = candidate.rarity;

            // Count how many of this card we already have
            const currentCount = optimizedSpells.filter(c => (c.baseName || c.name) === baseName).length;
            const maxCopies = getMaxCopiesForRarity(rarity);

            // Only add if we haven't hit the limit and deck isn't full
            if (currentCount < maxCopies && optimizedSpells.length < 50) {
                optimizedSpells.push(candidate);
            }
        }
    }

    // Get the deck's regional strategy
    const strategy = evaluateRegionalStrategy(selectedSpells);

    // Prioritize cards that match the strategy
    if (strategy !== "mixed") {
        allCandidates.sort((a, b) => {
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
            
            // Fall back to original sorting
            return calculateSynergy(b, optimizedSpells) - calculateSynergy(a, optimizedSpells);
        });
    }

    // ENHANCEMENT: Final pass to check playability at each mana cost
    const finalDeck = optimizedSpells.slice(0, 50);  // Ensure we don't exceed 50 cards
    
    // Analyze final mana curve for reporting purposes
    const finalManaCosts: ManaCostDistribution = {};
    finalDeck.forEach(card => {
        const cost = Math.min(card.mana_cost || 0, 7);
        finalManaCosts[cost] = (finalManaCosts[cost] || 0) + 1;
    });
    
    // Check for potential playability issues
    console.log("\nFinal deck playability analysis:");
    
    // Check early game playability
    const earlyGameCards = (finalManaCosts[0] || 0) + (finalManaCosts[1] || 0) + (finalManaCosts[2] || 0);
    if (earlyGameCards < 12) {
        console.log(`⚠️ WARNING: Only ${earlyGameCards} early game cards (0-2 mana). Consider adding more low-cost cards.`);
    } else {
        console.log(`✓ Good early game presence: ${earlyGameCards} cards costing 0-2 mana`);
    }
    
    // Check mid game playability
    const midGameCards = (finalManaCosts[3] || 0) + (finalManaCosts[4] || 0);
    if (midGameCards < 10) {
        console.log(`⚠️ WARNING: Only ${midGameCards} mid-game cards (3-4 mana). This could create a weak mid-game.`);
    } else {
        console.log(`✓ Good mid-game presence: ${midGameCards} cards costing 3-4 mana`);
    }
    
    // Check card draw/advantage
    const cardAdvantageCount = finalDeck.filter(card => {
        const text = (card.text || "").toLowerCase();
        return text.includes("draw") || text.includes("search") || text.includes("cycle");
    }).length;
    
    if (cardAdvantageCount < 5) {
        console.log(`⚠️ WARNING: Only ${cardAdvantageCount} cards that provide card advantage. Consider adding more card draw.`);
    } else {
        console.log(`✓ Good card advantage: ${cardAdvantageCount} cards that draw, search, or cycle`);
    }
    
    // Check mana production
    const manaAcceleration = finalDeck.filter(card => {
        const text = (card.text || "").toLowerCase();
        return text.includes("add") && text.includes("mana");
    }).length;
    
    if (manaAcceleration < 3 && (finalManaCosts[5] || 0) + (finalManaCosts[6] || 0) + (finalManaCosts[7] || 0) > 8) {
        console.log(`⚠️ WARNING: Deck has ${manaAcceleration} mana acceleration cards but ${(finalManaCosts[5] || 0) + (finalManaCosts[6] || 0) + (finalManaCosts[7] || 0)} high-cost cards.`);
    } else if (manaAcceleration >= 3) {
        console.log(`✓ Good mana production: ${manaAcceleration} cards that generate additional mana`);
    }
    
    return finalDeck;
}
