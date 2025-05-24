import { Card } from '../../types/Card';
import { 
    identifyCardCombos, 
    identifyDeckArchetypes,
    Combo,
    ArchetypeMatch
} from '../../core/cards/cardCombos';

export interface DeckAnalysis {
    combos: Combo[];
    archetypes: ArchetypeMatch[];
}

/**
 * Cached deck analysis to avoid recalculating for each card
 */
const deckAnalysisCache = new Map<string, DeckAnalysis>();
const MAX_CACHE_SIZE = 10; // Limit cache size to avoid memory issues

/**
 * Get or calculate deck analysis (combos and archetypes)
 * @param deck Current deck being built
 * @returns Deck analysis with combos and archetypes
 */
export function getDeckAnalysis(deck: Card[]): DeckAnalysis {
    // Generate a cache key based on deck composition
    // Using card names joined with commas as a simple hash
    const cacheKey = deck.map(c => c.baseName || '').sort().join(',');
    
    // If we have this analysis cached, return it
    if (deckAnalysisCache.has(cacheKey)) {
        const cached = deckAnalysisCache.get(cacheKey);
        if (cached) {
            return cached;
        }
    }
    
    // Calculate fresh deck analysis
    const identifiedCombos = identifyCardCombos(deck);
    const identifiedArchetypes = identifyDeckArchetypes(deck);
    const analysis: DeckAnalysis = {
        combos: identifiedCombos ? identifiedCombos : [],
        archetypes: Array.isArray(identifiedArchetypes) ? identifiedArchetypes : []
    };
    
    // Cache the result
    if (deckAnalysisCache.size >= MAX_CACHE_SIZE) {
        // If cache is full, remove the oldest entry
        const oldestKey = Array.from(deckAnalysisCache.keys())[0];
        if (oldestKey) {
            deckAnalysisCache.delete(oldestKey);
        }
    }
    deckAnalysisCache.set(cacheKey, analysis);
    
    return analysis;
}

/**
 * Clear the deck analysis cache
 */
export function clearAnalysisCache(): void {
    deckAnalysisCache.clear();
}
