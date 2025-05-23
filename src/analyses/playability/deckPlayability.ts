/**
 * Deck Playability Analyzer for Sorcery: Contested Realm
 * 
 * This module analyzes the playability of a deck, focusing on ensuring 
 * that the player has enough cards to play at each stage of the game.
 */

import { Card, Element } from '../../types/Card';

interface ManaCurve {
    [cost: number]: number;
}

interface GamePhaseAnalysis {
    cards: number;
    recommended: number;
    score: number;
}

export interface PlayabilityAnalysis {
    playabilityScore: number;
    issues: string[];
    manaCurve: ManaCurve;
    earlyGame: GamePhaseAnalysis;
    midGame: GamePhaseAnalysis;
    lateGame: GamePhaseAnalysis;
    removal: GamePhaseAnalysis;
    cardAdvantage: GamePhaseAnalysis;
    threats: GamePhaseAnalysis;
    elementalBalance: {
        primary: string;
        secondary: string;
        diversity: number;
        score: number;
    };
    synergies: {
        count: number;
        strength: number;
        score: number;
    };
}

export interface PlayabilityRecommendation {
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    issue: string;
    suggestion: string;
    targetCards?: string[];
}

/**
 * Analyzes the overall playability of a deck
 * @param deck - The deck to analyze
 * @returns A detailed analysis of the deck's playability
 */
export function analyzeDeckPlayability(deck: Card[]): PlayabilityAnalysis {
    if (!Array.isArray(deck) || deck.length === 0) {
        return { 
            playabilityScore: 0,
            issues: ['Empty or invalid deck'],
            manaCurve: {},
            earlyGame: { cards: 0, recommended: 12, score: 0 },
            midGame: { cards: 0, recommended: 10, score: 0 },
            lateGame: { cards: 0, recommended: 6, score: 0 },
            removal: { cards: 0, recommended: 8, score: 0 },
            cardAdvantage: { cards: 0, recommended: 6, score: 0 },
            threats: { cards: 0, recommended: 10, score: 0 },
            elementalBalance: { primary: '', secondary: '', diversity: 0, score: 0 },
            synergies: { count: 0, strength: 0, score: 0 }
        };
    }
    
    // Calculate mana curve
    const manaCurve: ManaCurve = {};
    for (let i = 0; i <= 7; i++) {
        manaCurve[i] = 0;
    }
    
    deck.forEach(card => {
        const cost = Math.min(card.mana_cost || 0, 7);
        manaCurve[cost]++;
    });
    
    // Analyze deck playability factors
    const analysis: PlayabilityAnalysis = {
        playabilityScore: 0,
        issues: [],
        
        // Mana curve analysis
        manaCurve,
        
        // Early game (turns 1-3)
        earlyGame: {
            cards: manaCurve[0] + manaCurve[1] + manaCurve[2],
            recommended: 12,
            score: 0
        },
        
        // Mid game (turns 4-6)
        midGame: {
            cards: manaCurve[3] + manaCurve[4],
            recommended: 10,
            score: 0
        },
        
        // Late game (turn 7+)
        lateGame: {
            cards: manaCurve[5] + manaCurve[6] + manaCurve[7],
            recommended: 6,
            score: 0
        },
        
        // Removal spells
        removal: {
            cards: 0,
            recommended: 8,
            score: 0
        },
        
        // Card advantage engines
        cardAdvantage: {
            cards: 0,
            recommended: 6,
            score: 0
        },
        
        // Win conditions / threats
        threats: {
            cards: 0,
            recommended: 10,
            score: 0
        },
        
        // Elemental balance
        elementalBalance: {
            primary: '',
            secondary: '',
            diversity: 0,
            score: 0
        },
        
        // Synergies
        synergies: {
            count: 0,
            strength: 0,
            score: 0
        }
    };
    
    // Analyze specific card types
    analyzeCardTypes(deck, analysis);
    
    // Analyze elemental balance
    analyzeElementalBalance(deck, analysis);
    
    // Calculate phase scores
    calculatePhaseScores(analysis);
    
    // Calculate overall playability score
    analysis.playabilityScore = calculateOverallScore(analysis);
    
    // Identify issues
    identifyPlayabilityIssues(analysis);
    
    return analysis;
}

function analyzeCardTypes(deck: Card[], analysis: PlayabilityAnalysis): void {
    deck.forEach(card => {
        const text = (card.text || '').toLowerCase();
        const type = (card.type || '').toLowerCase();
        
        // Count removal spells
        if (text.includes('destroy') || text.includes('banish') || 
            text.includes('damage') || text.includes('remove')) {
            analysis.removal.cards++;
        }
        
        // Count card advantage
        if (text.includes('draw') || text.includes('search') || 
            text.includes('return') || text.includes('cycle')) {
            analysis.cardAdvantage.cards++;
        }
        
        // Count threats (high power minions or game-ending effects)
        if ((card.power && card.power >= 4) || 
            text.includes('win') || text.includes('lose')) {
            analysis.threats.cards++;
        }
    });
}

function analyzeElementalBalance(deck: Card[], analysis: PlayabilityAnalysis): void {
    const elementCounts: { [element: string]: number } = {};
    
    deck.forEach(card => {
        if (card.elements) {
            card.elements.forEach(element => {
                elementCounts[element] = (elementCounts[element] || 0) + 1;
            });
        }
    });
    
    const sortedElements = Object.entries(elementCounts)
        .sort((a, b) => b[1] - a[1]);
    
    analysis.elementalBalance.diversity = Object.keys(elementCounts).length;
    
    if (sortedElements.length > 0) {
        analysis.elementalBalance.primary = sortedElements[0][0];
    }
    if (sortedElements.length > 1) {
        analysis.elementalBalance.secondary = sortedElements[1][0];
    }
    
    // Score elemental balance (prefer 1-3 elements)
    if (analysis.elementalBalance.diversity <= 3) {
        analysis.elementalBalance.score = 80 + (3 - analysis.elementalBalance.diversity) * 10;
    } else {
        analysis.elementalBalance.score = Math.max(0, 80 - (analysis.elementalBalance.diversity - 3) * 15);
    }
}

function calculatePhaseScores(analysis: PlayabilityAnalysis): void {
    // Early game score
    const earlyRatio = analysis.earlyGame.cards / analysis.earlyGame.recommended;
    analysis.earlyGame.score = Math.min(100, earlyRatio * 100);
    
    // Mid game score
    const midRatio = analysis.midGame.cards / analysis.midGame.recommended;
    analysis.midGame.score = Math.min(100, midRatio * 100);
    
    // Late game score
    const lateRatio = analysis.lateGame.cards / analysis.lateGame.recommended;
    analysis.lateGame.score = Math.min(100, lateRatio * 100);
    
    // Removal score
    const removalRatio = analysis.removal.cards / analysis.removal.recommended;
    analysis.removal.score = Math.min(100, removalRatio * 100);
    
    // Card advantage score
    const advantageRatio = analysis.cardAdvantage.cards / analysis.cardAdvantage.recommended;
    analysis.cardAdvantage.score = Math.min(100, advantageRatio * 100);
    
    // Threats score
    const threatsRatio = analysis.threats.cards / analysis.threats.recommended;
    analysis.threats.score = Math.min(100, threatsRatio * 100);
}

function calculateOverallScore(analysis: PlayabilityAnalysis): number {
    const weights = {
        earlyGame: 0.25,
        midGame: 0.20,
        lateGame: 0.15,
        removal: 0.15,
        cardAdvantage: 0.10,
        threats: 0.10,
        elementalBalance: 0.05
    };
    
    return Math.round(
        analysis.earlyGame.score * weights.earlyGame +
        analysis.midGame.score * weights.midGame +
        analysis.lateGame.score * weights.lateGame +
        analysis.removal.score * weights.removal +
        analysis.cardAdvantage.score * weights.cardAdvantage +
        analysis.threats.score * weights.threats +
        analysis.elementalBalance.score * weights.elementalBalance
    );
}

function identifyPlayabilityIssues(analysis: PlayabilityAnalysis): void {
    if (analysis.earlyGame.score < 70) {
        analysis.issues.push('Insufficient early game presence - add more 1-3 mana cards');
    }
    
    if (analysis.midGame.score < 60) {
        analysis.issues.push('Weak mid-game - consider more 4-5 mana threats');
    }
    
    if (analysis.removal.score < 50) {
        analysis.issues.push('Limited removal options - add more interaction spells');
    }
    
    if (analysis.cardAdvantage.score < 40) {
        analysis.issues.push('Poor card advantage - include more draw/search effects');
    }
    
    if (analysis.threats.score < 60) {
        analysis.issues.push('Insufficient win conditions - add more powerful threats');
    }
    
    if (analysis.elementalBalance.diversity > 4) {
        analysis.issues.push('Too many elements - focus on 2-3 elements for consistency');
    }
}

/**
 * Get specific recommendations for improving deck playability
 * @param deck - The deck to analyze
 * @returns Array of recommendations
 */
export function getPlayabilityRecommendations(deck: Card[]): PlayabilityRecommendation[] {
    const analysis = analyzeDeckPlayability(deck);
    const recommendations: PlayabilityRecommendation[] = [];
    
    // Early game recommendations
    if (analysis.earlyGame.score < 70) {
        recommendations.push({
            category: 'Early Game',
            priority: 'High',
            issue: 'Insufficient early game cards',
            suggestion: `Add ${analysis.earlyGame.recommended - analysis.earlyGame.cards} more 1-3 mana cards for better opening hands`,
            targetCards: ['1-cost minions', '2-cost removal', '3-cost threats']
        });
    }
    
    // Mid game recommendations
    if (analysis.midGame.score < 60) {
        recommendations.push({
            category: 'Mid Game',
            priority: 'Medium',
            issue: 'Weak mid-game presence',
            suggestion: `Add ${analysis.midGame.recommended - analysis.midGame.cards} more 4-5 mana cards for board control`,
            targetCards: ['4-cost minions', '5-cost bombs']
        });
    }
    
    // Removal recommendations
    if (analysis.removal.score < 50) {
        recommendations.push({
            category: 'Interaction',
            priority: 'High',
            issue: 'Limited removal options',
            suggestion: `Add ${analysis.removal.recommended - analysis.removal.cards} more removal/interaction spells`,
            targetCards: ['Damage spells', 'Destroy effects', 'Banish spells']
        });
    }
    
    // Card advantage recommendations
    if (analysis.cardAdvantage.score < 40) {
        recommendations.push({
            category: 'Card Advantage',
            priority: 'Medium',
            issue: 'Poor card advantage engines',
            suggestion: `Add ${analysis.cardAdvantage.recommended - analysis.cardAdvantage.cards} more draw/search effects`,
            targetCards: ['Draw spells', 'Search effects', 'Cycling cards']
        });
    }
    
    // Threats recommendations
    if (analysis.threats.score < 60) {
        recommendations.push({
            category: 'Win Conditions',
            priority: 'High',
            issue: 'Insufficient win conditions',
            suggestion: `Add ${analysis.threats.recommended - analysis.threats.cards} more powerful threats`,
            targetCards: ['High-power minions', 'Game-ending effects']
        });
    }
    
    // Elemental balance recommendations
    if (analysis.elementalBalance.diversity > 4) {
        recommendations.push({
            category: 'Mana Base',
            priority: 'Medium',
            issue: 'Too many elements',
            suggestion: 'Focus on 2-3 elements maximum for better consistency',
            targetCards: [`${analysis.elementalBalance.primary} cards`, `${analysis.elementalBalance.secondary} cards`]
        });
    }
    
    return recommendations;
}

/**
 * Calculate card value based on playability factors
 * @param card - The card to evaluate
 * @param deck - The current deck context
 * @returns Playability score for the card
 */
export function calculateCardPlayabilityScore(card: Card, deck: Card[]): number {
    let score = 50; // Base score
    
    const cost = card.mana_cost || 0;
    const text = (card.text || '').toLowerCase();
    
    // Mana cost evaluation
    if (cost <= 2) score += 15; // Early game valuable
    else if (cost <= 4) score += 10; // Mid game solid
    else if (cost >= 6) score -= 5; // Late game harder to cast
    
    // Power/toughness evaluation for minions
    if (card.power && card.life) {
        const statTotal = card.power + card.life;
        if (statTotal >= cost * 2.5) score += 10; // Efficient stats
        else if (statTotal < cost * 1.5) score -= 10; // Poor stats
    }
    
    // Ability evaluation
    if (text.includes('draw')) score += 12;
    if (text.includes('search')) score += 8;
    if (text.includes('destroy')) score += 10;
    if (text.includes('damage')) score += 8;
    if (text.includes('protection') || text.includes('ward')) score += 6;
    if (text.includes('flying') || text.includes('unblockable')) score += 5;
    
    // Element synergy with deck
    const elementCounter: { [element: string]: number } = {};
    deck.forEach(c => {
        (c.elements || []).forEach(e => {
            elementCounter[e] = (elementCounter[e] || 0) + 1;
        });
    });
    
    const sortedElements = Object.entries(elementCounter)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    
    // Bonus for matching primary elements
    if (sortedElements.length > 0 && card.elements) {
        if (card.elements.includes(sortedElements[0] as Element)) {
            score += 10;
        }
        if (sortedElements.length > 1 && card.elements.includes(sortedElements[1] as Element)) {
            score += 5;
        }
    }
    
    // Bonus for card advantage
    if (text.includes('draw')) score += 7;
    if (text.includes('search')) score += 5;
    if (text.includes('cycle')) score += 3;
    
    return Math.max(0, Math.min(100, score));
}
