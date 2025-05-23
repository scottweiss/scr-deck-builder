/**
 * Rule Enforcement and Suggestion System for Sorcery: Contested Realm
 * Provides comprehensive rule checking and deck improvement suggestions
 */

import { Card } from '../../types/Card';

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

interface Suggestion {
    priority: 'High' | 'Medium' | 'Low';
    issue: string;
    suggestion: string;
    ruleRef: string;
}

interface DeckAnalysis {
    lowCostRatio: number;
    averageManaCost: number;
    elementDistribution: { [element: string]: number };
    typeDistribution: { [type: string]: number };
}

interface RulesSummary {
    deckConstruction: string[];
    rarityLimits: string[];
    elementalRules: string[];
    spellcasterRules: string[];
    regionalStrategy: string[];
}

export const RuleEnforcer = {
    generateImprovementSuggestions(
        avatar: Card | null, 
        sites: Card[], 
        spells: Card[], 
        validationResult: ValidationResult
    ): Suggestion[] {
        const suggestions: Suggestion[] = [];
        
        // Analyze validation results and provide actionable suggestions
        validationResult.warnings.forEach(warning => {
            if (warning.includes('spellcasters')) {
                suggestions.push({
                    priority: 'High',
                    issue: 'Spellcaster Imbalance',
                    suggestion: 'Add more minions with "Spellcaster" ability to effectively cast your magic spells',
                    ruleRef: 'Spellcaster keyword ability allows minions to cast spells'
                });
            }
            
            if (warning.includes('affinity')) {
                const match = warning.match(/(\w+) affinity/);
                const element = match ? match[1] : 'elemental';
                suggestions.push({
                    priority: 'Medium',
                    issue: `${element} Threshold Risk`,
                    suggestion: `Add more ${element} sites to your Atlas to ensure reliable spell casting`,
                    ruleRef: 'Elemental threshold must be met to cast spells'
                });
            }
            
            if (warning.includes('strategy')) {
                suggestions.push({
                    priority: 'Medium',
                    issue: 'Mixed Strategy',
                    suggestion: 'Consider focusing on either surface or subsurface strategy for better consistency',
                    ruleRef: 'Regional strategies require supporting sites and spells'
                });
            }
        });
        
        // Additional deck optimization suggestions
        const deckAnalysis = this.analyzeDeckComposition(spells);
        
        if (deckAnalysis.lowCostRatio < 0.25) {
            suggestions.push({
                priority: 'Medium',
                issue: 'High Mana Curve',
                suggestion: 'Add more low-cost (1-2 mana) spells for early game presence',
                ruleRef: 'Early game development is crucial for controlling sites'
            });
        }
        
        if (deckAnalysis.averageManaCost > 4.5) {
            suggestions.push({
                priority: 'High',
                issue: 'Very High Mana Curve',
                suggestion: 'Consider lowering your curve or adding mana acceleration',
                ruleRef: 'Balanced mana curves provide consistent gameplay'
            });
        }
        
        // Element balance suggestions
        const elementCount = Object.keys(deckAnalysis.elementDistribution).length;
        if (elementCount > 3) {
            suggestions.push({
                priority: 'Medium',
                issue: 'Too Many Elements',
                suggestion: 'Focus on 2-3 elements maximum for better consistency',
                ruleRef: 'Elemental focus improves site synergy and threshold requirements'
            });
        }
        
        // Site count suggestions
        if (sites.length < 25) {
            suggestions.push({
                priority: 'High',
                issue: 'Insufficient Sites',
                suggestion: `Add ${30 - sites.length} more sites to reach the recommended 30`,
                ruleRef: 'Atlas should contain exactly 30 sites'
            });
        } else if (sites.length > 35) {
            suggestions.push({
                priority: 'Medium',
                issue: 'Too Many Sites',
                suggestion: `Remove ${sites.length - 30} sites to optimize Atlas size`,
                ruleRef: 'Atlas should contain exactly 30 sites for optimal consistency'
            });
        }
        
        return suggestions;
    },
    
    analyzeDeckComposition(spells: Card[]): DeckAnalysis {
        if (!spells || spells.length === 0) {
            return {
                lowCostRatio: 0,
                averageManaCost: 0,
                elementDistribution: {},
                typeDistribution: {}
            };
        }
        
        const lowCostCards = spells.filter(spell => (spell.mana_cost || 0) <= 2);
        const totalManaCost = spells.reduce((sum, spell) => sum + (spell.mana_cost || 0), 0);
        
        const elementDistribution: { [element: string]: number } = {};
        const typeDistribution: { [type: string]: number } = {};
        
        spells.forEach(spell => {
            // Count elements
            if (spell.elements) {
                spell.elements.forEach(element => {
                    elementDistribution[element] = (elementDistribution[element] || 0) + 1;
                });
            }
            
            // Count types
            if (spell.type) {
                const type = spell.type.toLowerCase();
                typeDistribution[type] = (typeDistribution[type] || 0) + 1;
            }
        });
        
        return {
            lowCostRatio: lowCostCards.length / spells.length,
            averageManaCost: totalManaCost / spells.length,
            elementDistribution,
            typeDistribution
        };
    },
    
    generateRulesSummary(): RulesSummary {
        return {
            deckConstruction: [
                'Atlas: Exactly 30 site cards',
                'Spellbook: 60-65 spell cards (no duplicates beyond rarity limits)',
                'Avatar: Exactly 1 avatar card',
                'No more than 4 copies of any ordinary spell',
                'No more than 3 copies of any exceptional spell',
                'No more than 2 copies of any elite spell',
                'No more than 1 copy of any unique spell'
            ],
            rarityLimits: [
                'Ordinary: Up to 4 copies per deck',
                'Exceptional: Up to 3 copies per deck', 
                'Elite: Up to 2 copies per deck',
                'Unique: Up to 1 copy per deck',
                'Rarity symbols: ● Ordinary, ◆ Exceptional, ▲ Elite, ★ Unique'
            ],
            elementalRules: [
                'Spells require elemental thresholds to cast',
                'Sites provide elemental thresholds when in realms',
                'Elements: Water, Fire, Earth, Air, Void',
                'Multi-element spells require multiple thresholds',
                'Affinity reduces threshold requirements'
            ],
            spellcasterRules: [
                'Magic spells require spellcasters to cast',
                'Spellcaster minions can cast magic spells',
                'Avatar is always considered a spellcaster',
                'Some artifacts grant spellcaster ability',
                'Spellcaster count affects spell casting efficiency'
            ],
            regionalStrategy: [
                'Surface vs subsurface operations',
                'Water sites enable underwater movement',
                'Land sites support surface activities',
                'Mixed strategies require mobility spells'
            ]
        };
    },
    
    checkAdvancedRules(avatar: Card | null, sites: Card[], spells: Card[]): string[] {
        const warnings: string[] = [];
        
        // Check for infinite combo potential
        const comboCards = spells.filter(spell => {
            const text = (spell.text || spell.extDescription || '').toLowerCase();
            return text.includes('untap') || text.includes('extra turn') || 
                   text.includes('free') || text.includes('copy');
        });
        
        if (comboCards.length > 3) {
            warnings.push('Potential infinite combo elements detected - ensure legal interactions');
        }
        
        // Check for proper win condition distribution
        const winConditions = spells.filter(spell => 
            (spell.power || 0) >= 6 || (spell.text || '').toLowerCase().includes('win'));
        
        if (winConditions.length < 3) {
            warnings.push('Few clear win conditions - consider adding more powerful late-game threats');
        }
        
        // Check mana acceleration vs curve
        const manaAcceleration = spells.filter(spell => {
            const text = (spell.text || spell.extDescription || '').toLowerCase();
            return text.includes('mana') || text.includes('site');
        });
        
        const averageManaCost = spells.reduce((sum, spell) => sum + (spell.mana_cost || 0), 0) / spells.length;
        
        if (averageManaCost > 4 && manaAcceleration.length < 3) {
            warnings.push('High average mana cost with little acceleration - consider mana ramp spells');
        }
        
        // Check for proper removal/interaction
        const removalSpells = spells.filter(spell => {
            const text = (spell.text || spell.extDescription || '').toLowerCase();
            return text.includes('destroy') || text.includes('banish') || 
                   text.includes('remove') || text.includes('damage');
        });
        
        if (removalSpells.length < 5) {
            warnings.push('Limited removal options - consider adding more interaction spells');
        }
        
        // Check for card draw/advantage
        const cardAdvantage = spells.filter(spell => {
            const text = (spell.text || spell.extDescription || '').toLowerCase();
            return text.includes('draw') || text.includes('search') || 
                   text.includes('return') || text.includes('token');
        });
        
        if (cardAdvantage.length < 4) {
            warnings.push('Limited card advantage sources - consider adding draw or value engines');
        }
        
        return warnings;
    }
};

export default RuleEnforcer;
