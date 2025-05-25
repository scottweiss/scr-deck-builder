/**
 * Browser entry point for Sorcery deck builder
 * This file adapts the existing TypeScript deck building system for browser use
 */

// Import existing deck building functionality
import { processCardData } from '@/main/cardProcessor';
import { selectAvatar } from '@/main/avatarSelector';
import { Card, Element, CardType, CardRarity } from '@/types/Card';
import { Deck } from '@/types/Deck';
// Import deck building core
import * as deckBuilder from '@/core/deck/builder/deckBuilder';
import * as synergyCalculator from '@/analyses/synergy/synergyCalculator';
// Browser-compatible data loading
import { getAllCards } from '@/data/processed/sorceryCards';

/**
 * Interface for probability calculations
 */
interface ProbabilityAnalysis {
  drawProbability: {
    turn1: { [cardName: string]: number };
    turn3: { [cardName: string]: number };
    turn5: { [cardName: string]: number };
    turn7: { [cardName: string]: number };
  };
  consistencyScore: number;
  mulliganAdvice: string[];
  keyCardAvailability: {
    lowCost: number;
    winConditions: number;
    manaBase: number;
  };
}

/**
 * Interface for meta analysis
 */
interface MetaAnalysis {
  archetypeStrength: number;
  popularityScore: number;
  counterStrategies: string[];
  metaPosition: 'strong' | 'viable' | 'weak';
  recommendations: string[];
}

/**
 * Enhanced deck building result with probability analysis
 */
interface EnhancedDeckResult {
  deck: Card[];
  avatar: Card;
  stats: any;
  analysis: any;
  probabilityAnalysis: ProbabilityAnalysis;
  metaAnalysis: MetaAnalysis;
  deckConsistency: {
    score: number;
    factors: string[];
    improvements: string[];
  };
}

/**
 * Browser-compatible deck building interface
 */
export class BrowserDeckBuilder {
  private cards: Card[] = [];
  private loaded: boolean = false;

  /**
   * Initialize the deck builder with card data
   */
  async initialize(): Promise<void> {
    if (this.loaded) return;
    
    try {
      console.log('Loading Sorcery card data...');
      this.cards = await getAllCards();
      this.loaded = true;
      console.log(`Loaded ${this.cards.length} cards`);
    } catch (error) {
      console.error('Failed to load card data:', error);
      // Fallback to sample data if real data fails
      this.cards = this.getSampleCards();
      this.loaded = true;
    }
  }

  /**
   * Build a deck with the specified options (Enhanced with probability analysis)
   */
  async buildDeck(options: {
    preferredElements?: Element[];
    preferredElement?: Element;
    archetype?: string;
    avatar?: string;
    includeProbabilityAnalysis?: boolean;
  }): Promise<EnhancedDeckResult> {
    await this.initialize();

    // Process card data using existing function
    const cardData = await processCardData(['Beta', 'ArthurianLegends']);
    const { uniqueCards, avatars, sites, minions, artifacts, auras, magics, keywords, elements } = cardData;

    // Select avatar using existing function
    // Use the first preferred element if multiple are provided, or use the single preferredElement
    const preferredElement = options.preferredElements && options.preferredElements.length > 0 
      ? options.preferredElements[0] as Element
      : options.preferredElement;
      
    const avatarResult = selectAvatar(avatars, elements, keywords, uniqueCards, preferredElement);
    const selectedAvatar = avatarResult.selectedAvatar;

    // Build deck using existing deck builder
    const deckResult = deckBuilder.buildCompleteDeck({
      minions,
      artifacts,
      auras,
      magics,
      sites,
      uniqueCards,
      avatar: selectedAvatar,
      preferredElement: preferredElement,
      preferredElements: options.preferredElements,
      maxCards: 50
    });

    // Calculate synergy using existing calculator
    const totalSynergy = deckResult.spellbook.reduce((total, card) => {
      return total + synergyCalculator.calculateSynergy(card, deckResult.spellbook);
    }, 0);

    // Enhanced analysis with probability calculations
    const probabilityAnalysis = options.includeProbabilityAnalysis !== false 
      ? this.calculateProbabilityAnalysis(deckResult.spellbook, selectedAvatar)
      : this.getDefaultProbabilityAnalysis();

    const metaAnalysis = this.analyzeMetaPosition(deckResult.spellbook, options.archetype || 'Midrange');
    const deckConsistency = this.calculateDeckConsistency(deckResult.spellbook);

    return {
      deck: deckResult.spellbook,
      avatar: selectedAvatar!,
      stats: {
        totalCards: deckResult.spellbook.length,
        averageCost: deckResult.spellbook.reduce((sum, card) => sum + (card.mana_cost || 0), 0) / deckResult.spellbook.length,
        totalSynergy: totalSynergy
      },
      analysis: {
        synergy: totalSynergy,
        manaCurve: this.calculateManaCurve(deckResult.spellbook),
        elementDistribution: this.calculateElementDistribution(deckResult.spellbook),
        typeDistribution: this.calculateTypeDistribution(deckResult.spellbook)
      },
      probabilityAnalysis,
      metaAnalysis,
      deckConsistency
    };
  }

  /**
   * Get detailed deck analysis with recommendations
   */
  async getDeckAnalysis(deck: Card[], avatar?: Card): Promise<{
    probabilityAnalysis: ProbabilityAnalysis;
    metaAnalysis: MetaAnalysis;
    deckConsistency: any;
    recommendations: string[];
    strengths: string[];
    weaknesses: string[];
  }> {
    await this.initialize();
    
    const probabilityAnalysis = this.calculateProbabilityAnalysis(deck, avatar!);
    const metaAnalysis = this.analyzeMetaPosition(deck, 'Midrange'); // Default archetype
    const deckConsistency = this.calculateDeckConsistency(deck);
    
    const recommendations = this.generateDetailedRecommendations(deck, probabilityAnalysis, metaAnalysis, deckConsistency);
    const strengths = this.identifyDeckStrengths(deck, probabilityAnalysis);
    const weaknesses = this.identifyDeckWeaknesses(deck, probabilityAnalysis, deckConsistency);
    
    return {
      probabilityAnalysis,
      metaAnalysis,
      deckConsistency,
      recommendations,
      strengths,
      weaknesses
    };
  }

  /**
   * Generate detailed deck recommendations
   */
  private generateDetailedRecommendations(
    deck: Card[], 
    probabilityAnalysis: ProbabilityAnalysis,
    metaAnalysis: MetaAnalysis,
    consistencyAnalysis: any
  ): string[] {
    const recommendations: string[] = [];
    
    // Consistency recommendations
    if (probabilityAnalysis.consistencyScore < 70) {
      recommendations.push('Improve deck consistency by adding more low-cost cards');
    }
    
    if (consistencyAnalysis.score < 60) {
      recommendations.push('Consider restructuring mana curve for better flow');
    }
    
    // Meta recommendations
    if (metaAnalysis.metaPosition === 'weak') {
      recommendations.push('Deck may struggle in current meta - consider archetype changes');
    }
    
    // Mana curve recommendations
    const curve = this.calculateManaCurve(deck);
    const earlyGame = (curve[1] || 0) + (curve[2] || 0);
    if (earlyGame < 12) {
      recommendations.push('Add more early game cards (1-2 mana) for better tempo');
    }
    
    const lateGame = (curve[6] || 0) + (curve[7] || 0);
    if (lateGame > 8) {
      recommendations.push('Consider reducing late game cards to improve consistency');
    }
    
    // Element distribution recommendations
    const elementDist = this.calculateElementDistribution(deck);
    const elements = Object.keys(elementDist);
    if (elements.length > 3) {
      recommendations.push('Focus on fewer elements for better threshold consistency');
    }
    
    return recommendations;
  }

  /**
   * Identify deck strengths
   */
  private identifyDeckStrengths(deck: Card[], probabilityAnalysis: ProbabilityAnalysis): string[] {
    const strengths: string[] = [];
    
    if (probabilityAnalysis.consistencyScore >= 80) {
      strengths.push('High consistency and reliability');
    }
    
    if (probabilityAnalysis.keyCardAvailability.lowCost >= 70) {
      strengths.push('Strong early game presence');
    }
    
    if (probabilityAnalysis.keyCardAvailability.winConditions >= 60) {
      strengths.push('Good access to win conditions');
    }
    
    const curve = this.calculateManaCurve(deck);
    const midGame = (curve[3] || 0) + (curve[4] || 0);
    if (midGame >= 12) {
      strengths.push('Strong midgame board presence');
    }
    
    const uniqueCards = deck.filter(card => card.rarity === CardRarity.Unique).length;
    if (uniqueCards >= 3) {
      strengths.push('Powerful unique effects and synergies');
    }
    
    return strengths.length > 0 ? strengths : ['Balanced deck construction'];
  }

  /**
   * Identify deck weaknesses
   */
  private identifyDeckWeaknesses(deck: Card[], probabilityAnalysis: ProbabilityAnalysis, consistencyAnalysis: any): string[] {
    const weaknesses: string[] = [];
    
    if (probabilityAnalysis.consistencyScore < 50) {
      weaknesses.push('Low overall consistency');
    }
    
    if (probabilityAnalysis.keyCardAvailability.lowCost < 40) {
      weaknesses.push('Vulnerable to fast starts');
    }
    
    if (consistencyAnalysis.score < 50) {
      weaknesses.push('Suboptimal mana curve distribution');
    }
    
    const elementDist = this.calculateElementDistribution(deck);
    const maxElement = Math.max(...Object.values(elementDist));
    if (maxElement < deck.length * 0.4) {
      weaknesses.push('Unfocused elemental strategy');
    }
    
    const curve = this.calculateManaCurve(deck);
    const avgCost = deck.reduce((sum, card) => sum + (card.mana_cost || 0), 0) / deck.length;
    if (avgCost > 4.5) {
      weaknesses.push('High average mana cost may cause slow starts');
    }
    
    return weaknesses.length > 0 ? weaknesses : [];
  }

  /**
   * Calculate win probability against different archetypes
   */
  async calculateMatchupProbabilities(deck: Card[], avatar?: Card): Promise<{
    [archetype: string]: { winRate: number; confidence: string; notes: string[] }
  }> {
    await this.initialize();
    
    const archetypes = ['Aggro', 'Midrange', 'Control', 'Combo'];
    const matchups: any = {};
    
    for (const archetype of archetypes) {
      const analysis = this.analyzeMatchup(deck, archetype);
      matchups[archetype] = analysis;
    }
    
    return matchups;
  }

  /**
   * Analyze specific matchup
   */
  private analyzeMatchup(deck: Card[], opponentArchetype: string): { winRate: number; confidence: string; notes: string[] } {
    let winRate = 50; // Base 50%
    const notes: string[] = [];
    let confidence = 'Medium';
    
    const curve = this.calculateManaCurve(deck);
    const avgCost = deck.reduce((sum, card) => sum + (card.mana_cost || 0), 0) / deck.length;
    
    switch (opponentArchetype.toLowerCase()) {
      case 'aggro':
        // Against aggro, early game matters most
        const earlyGame = (curve[1] || 0) + (curve[2] || 0) + (curve[3] || 0);
        if (earlyGame >= 20) {
          winRate += 15;
          notes.push('Strong early game presence');
        } else if (earlyGame < 12) {
          winRate -= 20;
          notes.push('Vulnerable to fast pressure');
        }
        
        // Lifegain and removal help
        const removal = deck.filter(card => 
          card.text?.toLowerCase().includes('destroy') || 
          card.text?.toLowerCase().includes('damage')
        ).length;
        if (removal >= 6) {
          winRate += 10;
          notes.push('Good removal suite');
        }
        break;
        
      case 'control':
        // Against control, pressure and card advantage matter
        if (avgCost <= 3.5) {
          winRate += 15;
          notes.push('Fast pressure strategy');
        }
        
        const cardDraw = deck.filter(card => 
          card.text?.toLowerCase().includes('draw') || 
          card.text?.toLowerCase().includes('search')
        ).length;
        if (cardDraw >= 4) {
          winRate += 10;
          notes.push('Good card advantage');
        }
        break;
        
      case 'midrange':
        // Mirror-like matchups depend on efficiency
        const midGame = (curve[3] || 0) + (curve[4] || 0) + (curve[5] || 0);
        if (midGame >= 15) {
          winRate += 10;
          notes.push('Strong midgame');
        }
        confidence = 'Low'; // Midrange mirrors are often close
        break;
        
      case 'combo':
        // Against combo, disruption and speed matter
        const disruption = deck.filter(card => 
          card.text?.toLowerCase().includes('counter') || 
          card.text?.toLowerCase().includes('discard')
        ).length;
        if (disruption >= 3) {
          winRate += 20;
          notes.push('Good disruption package');
        } else {
          winRate -= 10;
          notes.push('Limited interaction with combo');
        }
        break;
    }
    
    // Adjust confidence based on analysis depth
    if (notes.length >= 2) confidence = 'High';
    if (notes.length === 0) confidence = 'Low';
    
    return {
      winRate: Math.max(20, Math.min(80, winRate)),
      confidence,
      notes
    };
  }

  /**
   * Get deck optimization suggestions
   */
  async getOptimizationSuggestions(deck: Card[], avatar?: Card, targetArchetype?: string): Promise<{
    cardSwaps: Array<{ remove: string; add: string; reason: string }>;
    curveAdjustments: string[];
    elementalOptimizations: string[];
    overallScore: number;
    priorityChanges: string[];
  }> {
    await this.initialize();
    
    const analysis = await this.getDeckAnalysis(deck, avatar);
    const suggestions = {
      cardSwaps: this.suggestCardSwaps(deck, analysis, targetArchetype),
      curveAdjustments: this.suggestCurveAdjustments(deck),
      elementalOptimizations: this.suggestElementalOptimizations(deck),
      overallScore: this.calculateOverallDeckScore(analysis),
      priorityChanges: this.identifyPriorityChanges(analysis)
    };
    
    return suggestions;
  }

  /**
   * Suggest specific card swaps
   */
  private suggestCardSwaps(deck: Card[], analysis: any, targetArchetype?: string): Array<{ remove: string; add: string; reason: string }> {
    const swaps: Array<{ remove: string; add: string; reason: string }> = [];
    
    // Identify high-cost cards that might be replaced
    const expensiveCards = deck.filter(card => (card.mana_cost || 0) >= 6);
    if (expensiveCards.length > 6 && targetArchetype !== 'Control') {
      expensiveCards.slice(0, 2).forEach(card => {
        swaps.push({
          remove: card.name,
          add: 'Lower cost alternative',
          reason: 'Reduce mana curve for better consistency'
        });
      });
    }
    
    // Identify singleton cards that could be increased
    const cardCounts = this.getCardCounts(deck);
    const singletons = Object.entries(cardCounts)
      .filter(([name, count]) => count === 1 && !deck.find(c => c.name === name && c.rarity === CardRarity.Unique))
      .slice(0, 3);
    
    singletons.forEach(([cardName, _]) => {
      swaps.push({
        remove: 'Weaker card',
        add: `Additional copy of ${cardName}`,
        reason: 'Improve consistency with key effects'
      });
    });
    
    return swaps;
  }

  /**
   * Suggest curve adjustments
   */
  private suggestCurveAdjustments(deck: Card[]): string[] {
    const adjustments: string[] = [];
    const curve = this.calculateManaCurve(deck);
    
    const earlyGame = (curve[1] || 0) + (curve[2] || 0);
    if (earlyGame < 10) {
      adjustments.push('Add 2-3 more early game cards (1-2 mana)');
    }
    
    const midGame = (curve[3] || 0) + (curve[4] || 0);
    if (midGame < 10) {
      adjustments.push('Add more midgame threats (3-4 mana)');
    } else if (midGame > 18) {
      adjustments.push('Reduce midgame density to smooth curve');
    }
    
    const lateGame = (curve[6] || 0) + (curve[7] || 0);
    if (lateGame > 8) {
      adjustments.push('Reduce late game cards for better consistency');
    } else if (lateGame < 2) {
      adjustments.push('Add 1-2 late game win conditions');
    }
    
    return adjustments;
  }

  /**
   * Suggest elemental optimizations
   */
  private suggestElementalOptimizations(deck: Card[]): string[] {
    const optimizations: string[] = [];
    const elementDist = this.calculateElementDistribution(deck);
    const elements = Object.entries(elementDist).sort(([,a], [,b]) => b - a);
    
    if (elements.length > 3) {
      optimizations.push(`Focus on top 2-3 elements: ${elements.slice(0, 3).map(([e]) => e).join(', ')}`);
    }
    
    // Check for threshold consistency
    elements.forEach(([element, count]) => {
      const ratio = count / deck.length;
      if (ratio > 0.15 && ratio < 0.3) {
        optimizations.push(`Consider committing more heavily to ${element} (currently ${Math.round(ratio * 100)}%)`);
      }
    });
    
    // Suggest threshold support
    const primaryElement = elements[0]?.[0];
    if (primaryElement && elements[0][1] >= deck.length * 0.4) {
      optimizations.push(`Add more ${primaryElement} threshold enablers for consistency`);
    }
    
    return optimizations;
  }

  /**
   * Calculate overall deck score
   */
  private calculateOverallDeckScore(analysis: any): number {
    const scores = [
      analysis.probabilityAnalysis.consistencyScore,
      analysis.deckConsistency.score,
      analysis.metaAnalysis.archetypeStrength,
      analysis.metaAnalysis.popularityScore
    ];
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * Identify priority changes
   */
  private identifyPriorityChanges(analysis: any): string[] {
    const priorities: string[] = [];
    
    if (analysis.probabilityAnalysis.consistencyScore < 60) {
      priorities.push('Improve deck consistency (highest priority)');
    }
    
    if (analysis.deckConsistency.score < 50) {
      priorities.push('Fix mana curve issues');
    }
    
    if (analysis.metaAnalysis.metaPosition === 'weak') {
      priorities.push('Reconsider archetype or major restructuring');
    }
    
    if (analysis.probabilityAnalysis.keyCardAvailability.lowCost < 50) {
      priorities.push('Add more early game options');
    }
    
    return priorities.length > 0 ? priorities : ['Deck is well-optimized'];
  }

  /**
   * Get available avatars
   * @param elements Optional array of preferred elements to filter avatars by
   */
  async getAvatars(elements?: Element[]): Promise<Card[]> {
    await this.initialize();
    let avatars = this.cards.filter(card => card.type === CardType.Avatar);
    
    // Filter by preferred elements if specified
    if (elements && elements.length > 0) {
      avatars = avatars.filter(avatar => 
        avatar.elements.some(element => elements.includes(element))
      );
    }
    
    return avatars;
  }

  /**
   * Get available elements
   */
  async getElements(): Promise<Element[]> {
    return [Element.Water, Element.Fire, Element.Earth, Element.Air, Element.Void];
  }

  /**
   * Search cards by name
   */
  async searchCards(query: string): Promise<Card[]> {
    await this.initialize();
    const lowerQuery = query.toLowerCase();
    return this.cards.filter(card => 
      card.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 20); // Limit results
  }

  /**
   * Get cards by type
   */
  async getCardsByType(type: string): Promise<Card[]> {
    await this.initialize();
    return this.cards.filter(card => card.type === type);
  }

  /**
   * Calculate mana curve distribution
   */
  private calculateManaCurve(deck: Card[]): { [cost: number]: number } {
    const curve: { [cost: number]: number } = {};
    deck.forEach(card => {
      const cost = Math.min(card.mana_cost || 0, 7);
      curve[cost] = (curve[cost] || 0) + 1;
    });
    return curve;
  }

  /**
   * Calculate element distribution
   */
  private calculateElementDistribution(deck: Card[]): { [element: string]: number } {
    const distribution: { [element: string]: number } = {};
    deck.forEach(card => {
      if (card.elements) {
        card.elements.forEach(element => {
          distribution[element] = (distribution[element] || 0) + 1;
        });
      }
    });
    return distribution;
  }

  /**
   * Calculate type distribution
   */
  private calculateTypeDistribution(deck: Card[]): { [type: string]: number } {
    const distribution: { [type: string]: number } = {};
    deck.forEach(card => {
      distribution[card.type] = (distribution[card.type] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Calculate probability analysis for deck consistency
   */
  private calculateProbabilityAnalysis(deck: Card[], avatar: Card): ProbabilityAnalysis {
    const totalCards = deck.length;
    const cardCounts = this.getCardCounts(deck);
    
    // Calculate hypergeometric probabilities for key turns
    const drawProbability = {
      turn1: this.calculateTurnProbabilities(cardCounts, totalCards, 7), // Initial hand
      turn3: this.calculateTurnProbabilities(cardCounts, totalCards, 9), // Hand + 2 draws
      turn5: this.calculateTurnProbabilities(cardCounts, totalCards, 11), // Hand + 4 draws
      turn7: this.calculateTurnProbabilities(cardCounts, totalCards, 13), // Hand + 6 draws
    };

    const consistencyScore = this.calculateConsistencyScore(deck, drawProbability);
    const mulliganAdvice = this.generateMulliganAdvice(deck, drawProbability);
    const keyCardAvailability = this.analyzeKeyCardAvailability(deck);

    return {
      drawProbability,
      consistencyScore,
      mulliganAdvice,
      keyCardAvailability
    };
  }

  /**
   * Get default probability analysis for fallback
   */
  private getDefaultProbabilityAnalysis(): ProbabilityAnalysis {
    return {
      drawProbability: {
        turn1: {},
        turn3: {},
        turn5: {},
        turn7: {}
      },
      consistencyScore: 50,
      mulliganAdvice: ['Analysis not available'],
      keyCardAvailability: {
        lowCost: 50,
        winConditions: 50,
        manaBase: 50
      }
    };
  }

  /**
   * Analyze meta position and provide strategic recommendations
   */
  private analyzeMetaPosition(deck: Card[], archetype: string): MetaAnalysis {
    // Analyze deck composition for meta strength
    const archetypeStrength = this.calculateArchetypeStrength(deck, archetype);
    const popularityScore = this.estimatePopularityScore(deck, archetype);
    const counterStrategies = this.identifyCounterStrategies(deck, archetype);
    const metaPosition = this.determineMetaPosition(archetypeStrength, popularityScore);
    const recommendations = this.generateMetaRecommendations(deck, archetype, metaPosition);

    return {
      archetypeStrength,
      popularityScore,
      counterStrategies,
      metaPosition,
      recommendations
    };
  }

  /**
   * Calculate deck consistency metrics
   */
  private calculateDeckConsistency(deck: Card[]): { score: number; factors: string[]; improvements: string[] } {
    const factors: string[] = [];
    const improvements: string[] = [];
    let score = 100;

    // Analyze mana curve consistency
    const manaCurve = this.calculateManaCurve(deck);
    const curveScore = this.analyzeCurveConsistency(manaCurve);
    if (curveScore < 80) {
      score -= (80 - curveScore) * 0.3;
      factors.push(`Suboptimal mana curve (${curveScore}%)`);
      improvements.push('Adjust mana curve distribution for better consistency');
    }

    // Analyze card redundancy
    const redundancyScore = this.analyzeCardRedundancy(deck);
    if (redundancyScore < 70) {
      score -= (70 - redundancyScore) * 0.2;
      factors.push(`Low card redundancy (${redundancyScore}%)`);
      improvements.push('Add more copies of key effects');
    }

    // Analyze elemental consistency
    const elementalScore = this.analyzeElementalConsistency(deck);
    if (elementalScore < 75) {
      score -= (75 - elementalScore) * 0.25;
      factors.push(`Elemental threshold issues (${elementalScore}%)`);
      improvements.push('Improve elemental balance for threshold requirements');
    }

    return {
      score: Math.max(0, Math.round(score)),
      factors,
      improvements
    };
  }

  /**
   * Get card counts for probability calculations
   */
  private getCardCounts(deck: Card[]): { [cardName: string]: number } {
    const counts: { [cardName: string]: number } = {};
    deck.forEach(card => {
      counts[card.name] = (counts[card.name] || 0) + 1;
    });
    return counts;
  }

  /**
   * Calculate hypergeometric probability for drawing specific cards
   */
  private calculateTurnProbabilities(cardCounts: { [cardName: string]: number }, deckSize: number, handSize: number): { [cardName: string]: number } {
    const probabilities: { [cardName: string]: number } = {};
    
    for (const [cardName, count] of Object.entries(cardCounts)) {
      // Hypergeometric distribution: probability of drawing at least 1 copy
      const probability = 1 - this.hypergeometric(0, deckSize, count, handSize);
      probabilities[cardName] = Math.round(probability * 100);
    }
    
    return probabilities;
  }

  /**
   * Hypergeometric distribution calculation
   */
  private hypergeometric(successes: number, population: number, successStates: number, samples: number): number {
    // P(X = k) = C(K,k) * C(N-K,n-k) / C(N,n)
    if (samples > population || successes > successStates || (samples - successes) > (population - successStates)) {
      return 0;
    }
    
    return this.combination(successStates, successes) * 
           this.combination(population - successStates, samples - successes) / 
           this.combination(population, samples);
  }

  /**
   * Combination calculation (n choose k)
   */
  private combination(n: number, k: number): number {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 1; i <= k; i++) {
      result = result * (n - i + 1) / i;
    }
    return result;
  }

  /**
   * Calculate overall consistency score
   */
  private calculateConsistencyScore(deck: Card[], drawProbability: any): number {
    let score = 0;
    let factors = 0;

    // Score based on low-cost cards availability
    const lowCostCards = deck.filter(card => (card.mana_cost || 0) <= 2).length;
    const lowCostProb = drawProbability.turn1;
    const avgLowCostProb = Object.values(lowCostProb).reduce((sum: number, prob: any) => sum + prob, 0) / Object.keys(lowCostProb).length || 0;
    score += Math.min(avgLowCostProb, 80);
    factors++;

    // Score based on mana curve distribution
    const curve = this.calculateManaCurve(deck);
    const curveScore = this.analyzeCurveConsistency(curve);
    score += curveScore;
    factors++;

    // Score based on card redundancy
    const redundancy = this.analyzeCardRedundancy(deck);
    score += redundancy;
    factors++;

    return Math.round(score / factors);
  }

  /**
   * Generate mulligan advice based on probabilities
   */
  private generateMulliganAdvice(deck: Card[], drawProbability: any): string[] {
    const advice: string[] = [];
    
    // Analyze early game needs
    const lowCostCards = deck.filter(card => (card.mana_cost || 0) <= 2);
    if (lowCostCards.length < 12) {
      advice.push('Consider mulliganing hands without early plays (1-2 mana)');
    }

    // Analyze mana requirements
    const elementDistribution = this.calculateElementDistribution(deck);
    const dominantElements = Object.entries(elementDistribution)
      .filter(([_, count]) => count >= deck.length * 0.3)
      .map(([element, _]) => element);
    
    if (dominantElements.length > 0) {
      advice.push(`Keep hands with ${dominantElements.join(' or ')} threshold cards`);
    }

    // Analyze win conditions
    const winConditions = deck.filter(card => 
      card.rarity === CardRarity.Elite || card.rarity === CardRarity.Unique || (card.mana_cost || 0) >= 6
    );
    if (winConditions.length >= 8) {
      advice.push('Mulligan hands with too many expensive cards');
    }

    return advice.length > 0 ? advice : ['Standard mulligan decisions apply'];
  }

  /**
   * Analyze key card availability
   */
  private analyzeKeyCardAvailability(deck: Card[]): { lowCost: number; winConditions: number; manaBase: number } {
    const total = deck.length;
    
    const lowCostCount = deck.filter(card => (card.mana_cost || 0) <= 2).length;
    const winConditionCount = deck.filter(card => 
      card.rarity === CardRarity.Elite || card.rarity === CardRarity.Unique || (card.mana_cost || 0) >= 6
    ).length;
    
    // Estimate mana base quality (cards that help with thresholds)
    const manaBaseCount = deck.filter(card => 
      card.type === CardType.Site || card.text?.toLowerCase().includes('threshold') || card.elements.length >= 2
    ).length;

    return {
      lowCost: Math.round((lowCostCount / total) * 100),
      winConditions: Math.round((winConditionCount / total) * 100),
      manaBase: Math.round((manaBaseCount / total) * 100)
    };
  }

  /**
   * Calculate archetype strength
   */
  private calculateArchetypeStrength(deck: Card[], archetype: string): number {
    let strength = 50; // Base strength

    switch (archetype.toLowerCase()) {
      case 'aggro':
        const lowCostRatio = deck.filter(card => (card.mana_cost || 0) <= 3).length / deck.length;
        strength = Math.round(lowCostRatio * 100);
        break;
      
      case 'control':
        const highCostRatio = deck.filter(card => (card.mana_cost || 0) >= 4).length / deck.length;
        const removalCards = deck.filter(card => 
          card.text?.toLowerCase().includes('destroy') || 
          card.text?.toLowerCase().includes('counter') ||
          card.text?.toLowerCase().includes('exile')
        ).length;
        strength = Math.round(((highCostRatio + (removalCards / deck.length)) / 2) * 100);
        break;
      
      case 'midrange':
        const midRangeCards = deck.filter(card => {
          const cost = card.mana_cost || 0;
          return cost >= 2 && cost <= 5;
        }).length;
        strength = Math.round((midRangeCards / deck.length) * 100);
        break;
      
      case 'combo':
        const uniqueCards = deck.filter(card => card.rarity === CardRarity.Unique).length;
        const synergisticCards = deck.filter(card => 
          card.text?.toLowerCase().includes('when') || 
          card.text?.toLowerCase().includes('if')
        ).length;
        strength = Math.round(((uniqueCards + synergisticCards) / deck.length) * 100);
        break;
      
      default:
        strength = 60; // Default for unknown archetypes
    }

    return Math.min(100, Math.max(0, strength));
  }

  /**
   * Estimate popularity score based on deck composition
   */
  private estimatePopularityScore(deck: Card[], archetype: string): number {
    // This would ideally be based on real meta data
    // For now, estimate based on card choices
    
    const popularCards = deck.filter(card => 
      card.rarity === CardRarity.Ordinary || card.rarity === CardRarity.Exceptional
    ).length;
    
    const stapleRatio = popularCards / deck.length;
    return Math.round(stapleRatio * 100);
  }

  /**
   * Identify counter strategies
   */
  private identifyCounterStrategies(deck: Card[], archetype: string): string[] {
    const strategies: string[] = [];
    
    const elementDistribution = this.calculateElementDistribution(deck);
    const dominantElement = Object.entries(elementDistribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    if (dominantElement) {
      strategies.push(`Target ${dominantElement} threshold disruption`);
    }

    switch (archetype.toLowerCase()) {
      case 'aggro':
        strategies.push('Lifegain and board clears');
        strategies.push('High-defense creatures');
        break;
      case 'control':
        strategies.push('Fast pressure and burn');
        strategies.push('Hand disruption');
        break;
      case 'midrange':
        strategies.push('Go bigger or faster');
        strategies.push('Value engines');
        break;
      case 'combo':
        strategies.push('Disruption and interaction');
        strategies.push('Faster clocks');
        break;
    }

    return strategies;
  }

  /**
   * Determine meta position
   */
  private determineMetaPosition(strength: number, popularity: number): 'strong' | 'viable' | 'weak' {
    const composite = (strength + popularity) / 2;
    
    if (composite >= 75) return 'strong';
    if (composite >= 50) return 'viable';
    return 'weak';
  }

  /**
   * Generate meta recommendations
   */
  private generateMetaRecommendations(deck: Card[], archetype: string, position: 'strong' | 'viable' | 'weak'): string[] {
    const recommendations: string[] = [];
    
    switch (position) {
      case 'strong':
        recommendations.push('Deck is well-positioned in the current meta');
        recommendations.push('Consider minor optimizations for specific matchups');
        break;
      case 'viable':
        recommendations.push('Deck has competitive potential with refinement');
        recommendations.push('Focus on improving consistency and card choices');
        break;
      case 'weak':
        recommendations.push('Consider significant changes to improve competitiveness');
        recommendations.push('Evaluate alternative archetypes or major deck restructuring');
        break;
    }

    // Add archetype-specific recommendations
    const avgCost = deck.reduce((sum, card) => sum + (card.mana_cost || 0), 0) / deck.length;
    if (avgCost > 4 && archetype.toLowerCase() !== 'control') {
      recommendations.push('Consider lowering average mana cost for better tempo');
    }

    return recommendations;
  }

  /**
   * Analyze curve consistency
   */
  private analyzeCurveConsistency(curve: { [cost: number]: number }): number {
    // Ideal curve varies by archetype, using general midrange curve as baseline
    const idealCurve: { [cost: number]: number } = { 0: 0, 1: 8, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2 };
    let score = 100;
    
    for (let cost = 1; cost <= 7; cost++) {
      const actual = curve[cost] || 0;
      const ideal = idealCurve[cost] || 0;
      const deviation = Math.abs(actual - ideal);
      score -= deviation * 2; // Penalize deviations
    }
    
    return Math.max(0, score);
  }

  /**
   * Analyze card redundancy
   */
  private analyzeCardRedundancy(deck: Card[]): number {
    const cardCounts = this.getCardCounts(deck);
    const effects: { [effect: string]: number } = {};
    
    // Group cards by general effects (simplified)
    deck.forEach(card => {
      const cost = card.mana_cost || 0;
      if (cost <= 2) effects['early'] = (effects['early'] || 0) + 1;
      else if (cost <= 4) effects['mid'] = (effects['mid'] || 0) + 1;
      else effects['late'] = (effects['late'] || 0) + 1;
      
      if (card.text?.toLowerCase().includes('destroy')) effects['removal'] = (effects['removal'] || 0) + 1;
      if (card.text?.toLowerCase().includes('draw')) effects['card_draw'] = (effects['card_draw'] || 0) + 1;
    });
    
    // Score based on having multiple cards for each effect
    let redundantEffects = 0;
    let totalEffects = 0;
    
    for (const [effect, count] of Object.entries(effects)) {
      totalEffects++;
      if (count >= 4) redundantEffects++;
    }
    
    return totalEffects > 0 ? Math.round((redundantEffects / totalEffects) * 100) : 50;
  }

  /**
   * Analyze elemental consistency
   */
  private analyzeElementalConsistency(deck: Card[]): number {
    const elementDistribution = this.calculateElementDistribution(deck);
    const totalCards = deck.length;
    
    // Check if deck has good threshold support for its main elements
    let score = 100;
    
    for (const [element, count] of Object.entries(elementDistribution)) {
      const ratio = count / totalCards;
      if (ratio < 0.3 && ratio > 0.1) {
        // Elements that are present but not well-supported
        score -= 20;
      }
    }
    
    // Bonus for focused elemental strategies
    const maxElementRatio = Math.max(...Object.values(elementDistribution)) / totalCards;
    if (maxElementRatio >= 0.6) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Fallback sample cards if real data loading fails
   */
  private getSampleCards(): Card[] {
    return [
      {
        name: "Sample Avatar",
        type: CardType.Avatar,
        elements: [Element.Water],
        mana_cost: 0,
        text: "Sample avatar for testing",
        power: 25,
        rarity: CardRarity.Unique,
        // Required properties from Card interface
        baseName: "Sample Avatar",
        cost: 0,
        productId: "sample-01",
        cleanName: "sample-avatar",
        imageUrl: "",
        categoryId: "avatar",
        groupId: "sample",
        url: "",
        modifiedOn: new Date().toISOString(),
        imageCount: "1",
        extRarity: "Unique",
        extDescription: "Sample avatar for testing",
        extCost: "0",
        extThreshold: "",
        extElement: "Water",
        extTypeLine: "Avatar",
        extCardCategory: "Avatar",
        extCardType: "Avatar",
        subTypeName: "",
        extPowerRating: "25",
        extCardSubtype: "",
        extFlavorText: "A sample avatar created for testing purposes",
        extDefensePower: "0",
        extLife: "0",
        setName: "Beta"
      },
      // Add more sample cards as needed
    ];
  }
}

// Export for global use
declare global {
  interface Window {
    SorceryDeckBuilder: typeof BrowserDeckBuilder;
  }
}

if (typeof window !== 'undefined') {
  window.SorceryDeckBuilder = BrowserDeckBuilder;
}

export default BrowserDeckBuilder;
