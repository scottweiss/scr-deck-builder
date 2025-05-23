/**
 * Module for selecting sites for the deck with enhanced rule compliance
 */

import { Card, Element } from '../../types/Card';

interface SiteSelectionOptions {
    preferAggressive?: boolean;
    preferControl?: boolean;
    maxCost?: number;
}

/**
 * Identifies if a site is a water site based on water threshold icon
 * @param site - The site card
 * @returns True if it's a water site
 */
function isWaterSite(site: Card): boolean {
    const text = (site.text || "").toLowerCase();
    const elements = site.elements || [];
    
    // Look for water element or water-related keywords
    return elements.includes(Element.Water) || 
           text.includes("water") || 
           text.includes("ocean") || 
           text.includes("sea") || 
           text.includes("river") || 
           text.includes("lake");
}

/**
 * Select sites for the deck with proper water/land balance
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
    const selectedSites: Card[] = [];
    
    // Separate water and land sites
    const waterSites = sites.filter(isWaterSite);
    const landSites = sites.filter(site => !isWaterSite(site));
    
    console.log(`Available sites: ${waterSites.length} water, ${landSites.length} land`);
    
    // Calculate optimal balance based on dominant element
    let waterRatio = 0.3; // Default 30% water sites
    if (dominantElement.toLowerCase() === "water") {
        waterRatio = 0.6; // Water-focused decks need more water sites
    } else if (dominantElement.toLowerCase() === "fire" || dominantElement.toLowerCase() === "earth") {
        waterRatio = 0.2; // Land-focused elements prefer fewer water sites
    }
    
    const targetWaterSites = Math.round(minRequired * waterRatio);
    const targetLandSites = minRequired - targetWaterSites;
    
    console.log(`Target site distribution: ${targetWaterSites} water, ${targetLandSites} land`);
    
    // Sort sites by score for selection
    const scoredWaterSites = waterSites
        .map(site => ({ site, score: calculateSiteScore(site, dominantElement) }))
        .sort((a, b) => b.score - a.score);
    
    const scoredLandSites = landSites
        .map(site => ({ site, score: calculateSiteScore(site, dominantElement) }))
        .sort((a, b) => b.score - a.score);
    
    // Select water sites
    const actualWaterSites = Math.min(targetWaterSites, scoredWaterSites.length);
    for (let i = 0; i < actualWaterSites; i++) {
        selectedSites.push(scoredWaterSites[i].site);
    }
    
    // Select land sites
    const actualLandSites = Math.min(targetLandSites, scoredLandSites.length);
    for (let i = 0; i < actualLandSites; i++) {
        selectedSites.push(scoredLandSites[i].site);
    }
    
    // If we don't have enough sites, fill remaining slots with best available
    const remaining = minRequired - selectedSites.length;
    if (remaining > 0) {
        const remainingSites = sites.filter(site => !selectedSites.includes(site))
            .map(site => ({ site, score: calculateSiteScore(site, dominantElement) }))
            .sort((a, b) => b.score - a.score);
        
        for (let i = 0; i < Math.min(remaining, remainingSites.length); i++) {
            selectedSites.push(remainingSites[i].site);
        }
    }
    
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
