/**
 * Module for selecting sites for the deck with enhanced rule compliance
 * and proper elemental distribution
 */

import { Card, Element } from '../../types/Card';
import { filterOutRubble, getCardElementalAffinity } from '../../utils/utils';
import { analyzeElementalRequirements } from './elementRequirementAnalyzer';

interface SiteSelectionOptions {
    preferAggressive?: boolean;
    preferControl?: boolean;
    maxCost?: number;
}

/**
 * Group sites by their elemental affinities
 * @param sites - The sites to group
 * @returns Map of element to sites with that element
 */
function groupSitesByElement(sites: Card[]): Record<string, Card[]> {
    const elementalSites: Record<string, Card[]> = {
        Water: [],
        Fire: [],
        Earth: [],
        Air: [],
        Void: []
    };
    
    // Group sites by their elements
    for (const site of sites) {
        const elements = site.elements || [];
        for (const element of elements) {
            if (!elementalSites[element]) {
                elementalSites[element] = [];
            }
            elementalSites[element].push(site);
        }
    }
    
    return elementalSites;
}

/**
 * Select sites for the deck with proper elemental distribution
 * @param sites - Available sites
 * @param dominantElement - The dominant element in the deck
 * @param minRequired - Minimum number of sites required (default: 30)
 * @param options - Additional options
 * @returns Selected sites
 */
export function selectSites(
    sites: Card[], 
    dominantElement: string, 
    minRequired: number = 30, 
    options: SiteSelectionOptions = {}
): Card[] {
    // Exclude all sites whose name includes 'Rubble'
    sites = filterOutRubble(sites);
    
    // Group sites by elemental affinity
    const elementalSites = groupSitesByElement(sites);
    
    // Log detailed elemental distribution
    console.log(`Available sites by element: ${elementalSites.Water.length} Water, ${elementalSites.Fire.length} Fire, ${elementalSites.Earth.length} Earth, ${elementalSites.Air.length} Air, ${elementalSites.Void.length} Void`);
    
    // Determine target ratios for each element, with dominant element getting the most
    const elementRatios: Record<string, number> = {
        Water: 0.2,
        Fire: 0.2,
        Earth: 0.2,
        Air: 0.2,
        Void: 0.0  // Void sites are rare and not usually necessary
    };
    
    // Adjust ratios based on dominant element
    const typedDominantElement = dominantElement as Element;
    elementRatios[typedDominantElement] = 0.4;
    
    // Ensure the ratios sum to 1
    const totalRatio = Object.values(elementRatios).reduce((sum, ratio) => sum + ratio, 0);
    Object.keys(elementRatios).forEach(element => {
        elementRatios[element] /= totalRatio;
    });
    
    const selectedSites: Card[] = [];
    const scoredSitesByElement: Record<string, {site: Card, score: number}[]> = {};
    
    // Score sites for each element
    Object.keys(elementalSites).forEach(element => {
        scoredSitesByElement[element] = elementalSites[element]
            .map(site => ({ site, score: calculateSiteScore(site, dominantElement) }))
            .sort((a, b) => b.score - a.score);
    });
    
    // First, add a base amount of each element
    Object.keys(elementRatios).forEach(element => {
        const targetCount = Math.round(minRequired * elementRatios[element]);
        const availableSites = scoredSitesByElement[element] || [];
        const sitesToAdd = Math.min(targetCount, availableSites.length);
        
        for (let i = 0; i < sitesToAdd; i++) {
            if (availableSites[i] && !selectedSites.includes(availableSites[i].site)) {
                selectedSites.push(availableSites[i].site);
            }
        }
    });
    
    // If we haven't met the minimum required sites, add more based on score
    if (selectedSites.length < minRequired) {
        const remaining = minRequired - selectedSites.length;
        const allScoredSites = sites
            .filter(site => !selectedSites.includes(site))
            .map(site => ({ site, score: calculateSiteScore(site, dominantElement) }))
            .sort((a, b) => b.score - a.score);
            
        for (let i = 0; i < Math.min(remaining, allScoredSites.length); i++) {
            selectedSites.push(allScoredSites[i].site);
        }
    }
    
    // Log detailed elemental distribution of selected sites
    const selectedElementalSites = groupSitesByElement(selectedSites);
    console.log(`Selected sites by element: ${selectedElementalSites.Water.length} Water, ${selectedElementalSites.Fire.length} Fire, ${selectedElementalSites.Earth.length} Earth, ${selectedElementalSites.Air.length} Air, ${selectedElementalSites.Void.length} Void`);
    console.log(`Selected ${selectedSites.length} sites total`);
    
    return selectedSites;
}

/**
 * Calculate a score for how good a site is for the deck
 * @param site - The site to score
 * @param dominantElement - The dominant element in the deck
 * @returns Score value (higher is better)
 */
function calculateSiteScore(site: Card, dominantElement: string): number {
    let score = 1; // Base score
    
    // Bonus for matching dominant element
    const elements = site.elements || [];
    if (elements.includes(dominantElement as Element)) {
        score += 3;
    }
    
    // Bonus for multiple elements (versatility)
    score += elements.length * 0.5;
    
    // Bonus for powerful abilities (rough estimate)
    const text = (site.text || "").toLowerCase();
    if (text.includes("draw") || text.includes("search")) {
        score += 2;
    }
    if (text.includes("mana") || text.includes("threshold")) {
        score += 1;
    }
    
    // Penalty for very high cost sites early in curve
    const cost = site.mana_cost || 0;
    if (cost > 3) {
        score -= 0.5;
    }
    
    return score;
}
