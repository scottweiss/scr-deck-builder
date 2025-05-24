// Spell parsing logic extracted from spellEffectSystem
import {
    SpellEffect,
    TargetSpecification,
    TargetRestriction,
    ConditionCheck
} from '../types/spellEffectTypes';

class SpellParser {
    public parseSpellText(spellText: string): SpellEffect[] {
        const effects: SpellEffect[] = [];
        const text = spellText.toLowerCase().trim();
        const clauses = text.split(/[.;]/).map(s => s.trim()).filter(s => s.length > 0);
        for (const clause of clauses) {
            const effect = this.parseClause(clause);
            if (effect) effects.push(effect);
        }
        return effects;
    }

    private parseClause(clause: string): SpellEffect | null {
        if (clause.includes('deal') && clause.includes('damage')) {
            return this.parseDamageEffect(clause);
        }
        if (clause.includes('heal') || clause.includes('gain') && clause.includes('life')) {
            return this.parseHealEffect(clause);
        }
        if (clause.includes('draw')) {
            return this.parseDrawEffect(clause);
        }
        if (clause.includes('summon') || clause.includes('create')) {
            return this.parseSummonEffect(clause);
        }
        if (clause.includes('gain') && (clause.includes('power') || clause.includes('life'))) {
            return this.parseModifyEffect(clause);
        }
        if (clause.includes('move') || clause.includes('teleport')) {
            return this.parseMoveEffect(clause);
        }
        if (clause.includes('destroy') || clause.includes('sacrifice')) {
            return this.parseDestroyEffect(clause);
        }
        if (clause.includes('counter') || clause.includes('cancel')) {
            return this.parseCounterEffect(clause);
        }
        if (clause.includes('search') || clause.includes('tutor')) {
            return this.parseSearchEffect(clause);
        }
        return null;
    }

    private parseDamageEffect(clause: string): SpellEffect {
        const damageMatch = clause.match(/(\d+)\s*damage/);
        const damage = damageMatch ? parseInt(damageMatch[1]) : 1;
        const targets = this.parseTargets(clause);
        return {
            type: 'damage',
            targets: targets.length > 0 ? targets : [this.createDefaultTarget('unit')],
            parameters: { amount: damage },
            conditions: this.parseConditions(clause)
        };
    }

    private parseHealEffect(clause: string): SpellEffect {
        const healMatch = clause.match(/(\d+)\s*(life|health)/);
        const amount = healMatch ? parseInt(healMatch[1]) : 1;
        const targets = this.parseTargets(clause);
        return {
            type: 'heal',
            targets: targets.length > 0 ? targets : [this.createDefaultTarget('unit')],
            parameters: { amount },
            conditions: this.parseConditions(clause)
        };
    }

    private parseDrawEffect(clause: string): SpellEffect {
        const drawMatch = clause.match(/draw\s*(\d+)?/);
        const amount = drawMatch && drawMatch[1] ? parseInt(drawMatch[1]) : 1;
        return {
            type: 'draw',
            targets: [this.createDefaultTarget('player')],
            parameters: { amount },
            conditions: this.parseConditions(clause)
        };
    }

    private parseSummonEffect(clause: string): SpellEffect {
        const nameMatch = clause.match(/summon\s+(?:a\s+)?([^.]+)/);
        const tokenName = nameMatch ? nameMatch[1].trim() : 'Token';
        const powerMatch = clause.match(/([0-9]+)\s*\/\s*([0-9]+)/);
        const power = powerMatch ? parseInt(powerMatch[1]) : 1;
        const life = powerMatch ? parseInt(powerMatch[2]) : 1;
        return {
            type: 'summon',
            targets: [this.createDefaultTarget('position')],
            parameters: {
                tokenName,
                power,
                life,
                elements: this.parseElements(clause)
            },
            conditions: this.parseConditions(clause)
        };
    }

    private parseModifyEffect(clause: string): SpellEffect {
        const powerMatch = clause.match(/([+-]\d+)\s*power/);
        const lifeMatch = clause.match(/([+-]\d+)\s*life/);
        const powerBonus = powerMatch ? parseInt(powerMatch[1]) : 0;
        const lifeBonus = lifeMatch ? parseInt(lifeMatch[1]) : 0;
        const targets = this.parseTargets(clause);
        return {
            type: 'modify',
            targets: targets.length > 0 ? targets : [this.createDefaultTarget('unit')],
            parameters: {
                powerBonus,
                lifeBonus,
                duration: this.parseDuration(clause)
            },
            conditions: this.parseConditions(clause)
        };
    }

    private parseMoveEffect(clause: string): SpellEffect {
        const targets = this.parseTargets(clause);
        return {
            type: 'move',
            targets: targets.length > 0 ? targets : [this.createDefaultTarget('unit')],
            parameters: {
                destination: 'target'
            },
            conditions: this.parseConditions(clause)
        };
    }

    private parseDestroyEffect(clause: string): SpellEffect {
        const targets = this.parseTargets(clause);
        return {
            type: 'destroy',
            targets: targets.length > 0 ? targets : [this.createDefaultTarget('unit')],
            parameters: {},
            conditions: this.parseConditions(clause)
        };
    }

    private parseCounterEffect(clause: string): SpellEffect {
        return {
            type: 'counter',
            targets: [this.createDefaultTarget('card')],
            parameters: {},
            conditions: this.parseConditions(clause)
        };
    }

    private parseSearchEffect(clause: string): SpellEffect {
        const cardTypeMatch = clause.match(/search.*for\s+(?:a\s+)?([^.]+)/);
        const cardType = cardTypeMatch ? cardTypeMatch[1].trim() : '';
        return {
            type: 'search',
            targets: [this.createDefaultTarget('player')],
            parameters: {
                cardType,
                zone: 'deck'
            },
            conditions: this.parseConditions(clause)
        };
    }

    private parseTargets(clause: string): TargetSpecification[] {
        const targets: TargetSpecification[] = [];
        if (clause.includes('target')) {
            if (clause.includes('player')) {
                targets.push(this.createTargetSpec('player', 1));
            } else if (clause.includes('unit') || clause.includes('minion') || clause.includes('creature')) {
                targets.push(this.createTargetSpec('unit', 1, this.parseTargetRestrictions(clause)));
            }
        }
        if (clause.includes('all ') || clause.includes('each ')) {
            if (clause.includes('player')) {
                targets.push(this.createTargetSpec('player', 99));
            } else if (clause.includes('unit') || clause.includes('minion') || clause.includes('creature')) {
                targets.push(this.createTargetSpec('unit', 99, this.parseTargetRestrictions(clause)));
            }
        }
        return targets;
    }

    private parseTargetRestrictions(clause: string): TargetRestriction[] {
        const restrictions: TargetRestriction[] = [];
        if (clause.includes('opponent')) {
            restrictions.push({
                property: 'ownerId',
                operator: '!=',
                value: 'caster'
            });
        } else if (clause.includes('friendly') || clause.includes('your')) {
            restrictions.push({
                property: 'ownerId',
                operator: '=',
                value: 'caster'
            });
        }
        const elements = ['air', 'earth', 'fire', 'water'];
        for (const element of elements) {
            if (clause.includes(element)) {
                restrictions.push({
                    property: 'elements',
                    operator: 'includes',
                    value: element
                });
            }
        }
        const powerMatch = clause.match(/power\s*([<>=!]+)\s*(\d+)/);
        if (powerMatch) {
            restrictions.push({
                property: 'power',
                operator: powerMatch[1] as any,
                value: parseInt(powerMatch[2])
            });
        }
        return restrictions;
    }

    private parseConditions(clause: string): ConditionCheck[] {
        const conditions: ConditionCheck[] = [];
        const ifMatch = clause.match(/if\s+(.+?)(?:\s+then|,|$)/);
        if (ifMatch) {
            const conditionText = ifMatch[1];
            if (conditionText.includes('you control')) {
                const unitMatch = conditionText.match(/you control\s+(?:a\s+)?([^,]+)/);
                if (unitMatch) {
                    conditions.push({
                        property: 'controlsUnit',
                        operator: '=',
                        value: unitMatch[1].trim(),
                        target: 'caster'
                    });
                }
            }
        }
        return conditions;
    }

    private parseElements(clause: string): string[] {
        const elements: string[] = [];
        const elementNames = ['air', 'earth', 'fire', 'water'];
        for (const element of elementNames) {
            if (clause.includes(element)) {
                elements.push(element);
            }
        }
        return elements;
    }

    private parseDuration(clause: string): string {
        if (clause.includes('permanently') || clause.includes('permanent')) {
            return 'permanent';
        } else if (clause.includes('this turn') || clause.includes('until end of turn')) {
            return 'turn';
        } else if (clause.includes('while') || clause.includes('as long as')) {
            return 'conditional';
        }
        return 'permanent';
    }

    private createDefaultTarget(type: 'unit' | 'player' | 'position' | 'card'): TargetSpecification {
        return this.createTargetSpec(type, 1);
    }

    private createTargetSpec(type: 'unit' | 'player' | 'position' | 'card', count: number, restrictions: TargetRestriction[] = []): TargetSpecification {
        return {
            type,
            count,
            restrictions,
            optional: false
        };
    }
}

export const spellParser = new SpellParser();
