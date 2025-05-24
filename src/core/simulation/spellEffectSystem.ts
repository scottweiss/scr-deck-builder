import { GameState, Card, Unit, Position, GameEvent, Player } from './gameState';

export interface SpellEffect {
    type: 'damage' | 'heal' | 'draw' | 'summon' | 'modify' | 'move' | 'destroy' | 'counter' | 'search' | 'custom';
    targets: TargetSpecification[];
    parameters: { [key: string]: any };
    conditions?: ConditionCheck[];
}

export interface TargetSpecification {
    type: 'unit' | 'player' | 'position' | 'card' | 'auto';
    count        switch (effect.type) {
            case 'damage':
                return this.executeDamageEffect(gameState, effect, resolvedTargets, events, casterId);
            case 'heal':
                return this.executeHealEffect(gameState, effect, resolvedTargets, events, casterId);
            case 'draw':
                return this.executeDrawEffect(gameState, effect, resolvedTargets, events, casterId);
            case 'summon':
                return this.executeSummonEffect(gameState, effect, resolvedTargets, events, casterId);
            case 'modify':
                return this.executeModifyEffect(gameState, effect, resolvedTargets, events);
            case 'move':
                return this.executeMoveEffect(gameState, effect, resolvedTargets, events);
            case 'destroy':
                return this.executeDestroyEffect(gameState, effect, resolvedTargets, events);estrictions: TargetRestriction[];
    optional: boolean;
}

export interface TargetRestriction {
    property: string;
    operator: '=' | '!=' | '<' | '>' | '<=' | '>=' | 'includes' | 'excludes';
    value: any;
}

export interface ConditionCheck {
    property: string;
    operator: '=' | '!=' | '<' | '>' | '<=' | '>=' | 'includes' | 'excludes';
    value: any;
    target: 'caster' | 'opponent' | 'game' | 'target';
}

export interface SpellTarget {
    type: 'unit' | 'player' | 'position' | 'card';
    id: string;
    position?: Position;
}

export interface SpellExecutionResult {
    success: boolean;
    events: GameEvent[];
    targetedItems: SpellTarget[];
    error?: string;
}

export class SpellEffectSystem {

    /**
     * Parses spell text and converts it to executable effects
     */
    public parseSpellText(spellText: string): SpellEffect[] {
        const effects: SpellEffect[] = [];
        
        // Normalize the text
        const text = spellText.toLowerCase().trim();
        
        // Split into sentences/clauses
        const clauses = text.split(/[.;]/).map(s => s.trim()).filter(s => s.length > 0);
        
        for (const clause of clauses) {
            const effect = this.parseClause(clause);
            if (effect) {
                effects.push(effect);
            }
        }
        
        return effects;
    }

    /**
     * Parses a single clause of spell text
     */
    private parseClause(clause: string): SpellEffect | null {
        // Damage effects
        if (clause.includes('deal') && clause.includes('damage')) {
            return this.parseDamageEffect(clause);
        }
        
        // Healing effects
        if (clause.includes('heal') || clause.includes('gain') && clause.includes('life')) {
            return this.parseHealEffect(clause);
        }
        
        // Draw effects
        if (clause.includes('draw')) {
            return this.parseDrawEffect(clause);
        }
        
        // Summon effects
        if (clause.includes('summon') || clause.includes('create')) {
            return this.parseSummonEffect(clause);
        }
        
        // Modify effects (buff/debuff)
        if (clause.includes('gain') && (clause.includes('power') || clause.includes('life'))) {
            return this.parseModifyEffect(clause);
        }
        
        // Move effects
        if (clause.includes('move') || clause.includes('teleport')) {
            return this.parseMoveEffect(clause);
        }
        
        // Destroy effects
        if (clause.includes('destroy') || clause.includes('sacrifice')) {
            return this.parseDestroyEffect(clause);
        }
        
        // Counter effects
        if (clause.includes('counter') || clause.includes('cancel')) {
            return this.parseCounterEffect(clause);
        }
        
        // Search effects
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
        // Parse token creation or unit summoning
        const nameMatch = clause.match(/summon\s+(?:a\s+)?([^.]+)/);
        const tokenName = nameMatch ? nameMatch[1].trim() : 'Token';
        
        const powerMatch = clause.match(/(\d+)\/(\d+)/);
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
                destination: 'target' // Would need more sophisticated parsing
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
                zone: 'deck' // Could be deck, graveyard, etc.
            },
            conditions: this.parseConditions(clause)
        };
    }

    private parseTargets(clause: string): TargetSpecification[] {
        const targets: TargetSpecification[] = [];
        
        // Check for "target" keyword
        if (clause.includes('target')) {
            if (clause.includes('player')) {
                targets.push(this.createTargetSpec('player', 1));
            } else if (clause.includes('unit') || clause.includes('minion') || clause.includes('creature')) {
                targets.push(this.createTargetSpec('unit', 1, this.parseTargetRestrictions(clause)));
            }
        }
        
        // Check for "all" or "each"
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
        
        // Owner restrictions
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
        
        // Element restrictions
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
        
        // Power/life restrictions
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
        
        // "If" conditions
        const ifMatch = clause.match(/if\s+(.+?)(?:\s+then|,|$)/);
        if (ifMatch) {
            const conditionText = ifMatch[1];
            
            // Parse simple conditions
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
        
        return 'permanent'; // Default
    }

    private createDefaultTarget(type: 'unit' | 'player' | 'position' | 'card'): TargetSpecification {
        return this.createTargetSpec(type, 1);
    }

    private createTargetSpec(
        type: 'unit' | 'player' | 'position' | 'card', 
        count: number, 
        restrictions: TargetRestriction[] = []
    ): TargetSpecification {
        return {
            type,
            count,
            restrictions,
            optional: false
        };
    }

    /**
     * Executes a spell's effects
     */
    public executeSpell(
        gameState: GameState, 
        spell: Card, 
        casterId: string, 
        targets: SpellTarget[]
    ): SpellExecutionResult {
        const effects = this.parseSpellText(spell.text || '');
        const events: GameEvent[] = [];
        const targetedItems: SpellTarget[] = [...targets];
        
        try {
            for (const effect of effects) {
                const result = this.executeEffect(gameState, effect, casterId, targets);
                events.push(...result.events);
                
                if (!result.success) {
                    return {
                        success: false,
                        events,
                        targetedItems,
                        error: result.error
                    };
                }
            }
            
            return {
                success: true,
                events,
                targetedItems
            };
        } catch (error) {
            return {
                success: false,
                events,
                targetedItems,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private executeEffect(
        gameState: GameState, 
        effect: SpellEffect, 
        casterId: string, 
        providedTargets: SpellTarget[]
    ): SpellExecutionResult {
        const events: GameEvent[] = [];
        
        // Check conditions
        if (effect.conditions) {
            for (const condition of effect.conditions) {
                if (!this.checkCondition(gameState, condition, casterId)) {
                    return {
                        success: false,
                        events,
                        targetedItems: [],
                        error: `Condition not met: ${condition.property} ${condition.operator} ${condition.value}`
                    };
                }
            }
        }
        
        // Resolve targets
        const resolvedTargets = this.resolveTargets(gameState, effect.targets, providedTargets, casterId);
        
        switch (effect.type) {
            case 'damage':
                return this.executeDamageEffect(gameState, effect, resolvedTargets, casterId, events);
            case 'heal':
                return this.executeHealEffect(gameState, effect, resolvedTargets, casterId, events);
            case 'draw':
                return this.executeDrawEffect(gameState, effect, casterId, events);
            case 'summon':
                return this.executeSummonEffect(gameState, effect, resolvedTargets, casterId, events);
            case 'modify':
                return this.executeModifyEffect(gameState, effect, resolvedTargets, events);
            case 'move':
                return this.executeMoveEffect(gameState, effect, resolvedTargets, events);
            case 'destroy':
                return this.executeDestroyEffect(gameState, effect, resolvedTargets, events);
            default:
                return {
                    success: false,
                    events,
                    targetedItems: [],
                    error: `Unknown effect type: ${effect.type}`
                };
        }
    }

    private executeDamageEffect(
        gameState: GameState, 
        effect: SpellEffect, 
        targets: SpellTarget[], 
        casterId: string,
        events: GameEvent[]
    ): SpellExecutionResult {
        const amount = effect.parameters.amount || 1;
        
        for (const target of targets) {
            if (target.type === 'unit') {
                const unit = gameState.units.get(target.id);
                if (unit) {
                    unit.damage = (unit.damage || 0) + amount;
                    
                    events.push({
                        id: `event_${Date.now()}_${Math.random()}`,
                        type: 'spell_damage',
                        activePlayer: casterId as 'player1' | 'player2',
                        description: `Spell dealt ${amount} damage to ${target.id}`,
                        targetUnit: target.id,
                        damage: amount,
                        resolved: true,
                        timestamp: Date.now(),
                        data: {
                            targetId: target.id,
                            damage: amount
                        }
                    });
                    
                    // Check if unit is destroyed
                    if ((unit.damage || 0) >= (unit.life || 0)) {
                        this.destroyUnit(gameState, target.id);
                        events.push(this.createGameEvent(
                            'unit_destroyed',
                            casterId as 'player1' | 'player2',
                            `Unit ${target.id} was destroyed by spell damage`,
                            {
                                targetUnit: target.id,
                                data: { unitId: target.id, cause: 'spell' }
                            }
                        ));
                    }
                }
            } else if (target.type === 'player') {
                const player = gameState.players[target.id as 'player1' | 'player2'];
                if (player) {
                    player.life = Math.max(0, player.life - amount);
                    
                    events.push(this.createGameEvent(
                        'player_damage',
                        casterId as 'player1' | 'player2',
                        `Player ${target.id} took ${amount} damage`,
                        {
                            damage: amount,
                            data: {
                                playerId: target.id
                            }
                        }
                    ));
                }
            }
        }
        
        return { success: true, events, targetedItems: targets };
    }

    private executeHealEffect(
        gameState: GameState, 
        effect: SpellEffect, 
        targets: SpellTarget[], 
        casterId: string,
        events: GameEvent[]
    ): SpellExecutionResult {
        const amount = effect.parameters.amount || 1;
        
        for (const target of targets) {
            if (target.type === 'unit') {
                const unit = gameState.units.get(target.id);
                if (unit) {
                    unit.damage = Math.max(0, (unit.damage || 0) - amount);
                    
                    events.push(this.createGameEvent(
                        'unit_healed',
                        casterId as 'player1' | 'player2',
                        `Unit ${target.id} was healed for ${amount}`,
                        {
                            targetUnit: target.id,
                            data: {
                                unitId: target.id,
                                amount: amount
                            }
                        }
                    ));
                }
            } else if (target.type === 'player') {
                const player = gameState.players[target.id as 'player1' | 'player2'];
                if (player) {
                    player.life += amount;
                    
                    events.push(this.createGameEvent(
                        'player_healed',
                        casterId as 'player1' | 'player2',
                        `Player ${target.id} was healed for ${amount}`,
                        {
                            data: {
                                playerId: target.id,
                                amount: amount
                            }
                        }
                    ));
                }
            }
        }
        
        return { success: true, events, targetedItems: targets };
    }

    private executeDrawEffect(
        gameState: GameState, 
        effect: SpellEffect, 
        casterId: string, 
        events: GameEvent[]
    ): SpellExecutionResult {
        const amount = effect.parameters.amount || 1;
        const player = gameState.players[casterId as 'player1' | 'player2'];
        
        if (!player) {
            return {
                success: false,
                events,
                targetedItems: [],
                error: 'Invalid caster'
            };
        }
        
        for (let i = 0; i < amount; i++) {
            const deck = player.decks.spellbook.length > 0 ? player.decks.spellbook : 
                        player.deck && player.deck.length > 0 ? player.deck : [];
            
            if (deck.length > 0) {
                const drawnCard = deck.shift()!;
                
                // Add to appropriate hand section based on card type
                if (drawnCard.type === 'Site') {
                    player.hand.sites.push(drawnCard);
                } else {
                    player.hand.spells.push(drawnCard);
                }
                
                events.push(this.createGameEvent(
                    'card_drawn',
                    casterId as 'player1' | 'player2',
                    `Player ${casterId} drew ${drawnCard.name}`,
                    {
                        data: {
                            playerId: casterId,
                            cardName: drawnCard.name
                        }
                    }
                ));
            }
        }
        
        return { success: true, events, targetedItems: [] };
    }

    private executeSummonEffect(
        gameState: GameState, 
        effect: SpellEffect, 
        targets: SpellTarget[], 
        casterId: string, 
        events: GameEvent[]
    ): SpellExecutionResult {
        const { tokenName, power, life, elements } = effect.parameters;
        
        for (const target of targets) {
            if (target.type === 'position' && target.position) {
                const unitId = `token_${Date.now()}_${Math.random()}`;
                
                // Create a basic token card
                const tokenCard: Card = {
                    productId: unitId,
                    name: tokenName || 'Token',
                    cleanName: tokenName || 'Token',
                    imageUrl: '',
                    categoryId: '',
                    groupId: '',
                    url: '',
                    modifiedOn: '',
                    imageCount: '',
                    extRarity: 'Ordinary',
                    extDescription: 'Token creature',
                    extCost: '0',
                    extThreshold: '',
                    extElement: '',
                    extTypeLine: 'Minion',
                    extCardCategory: '',
                    extCardType: 'Minion',
                    subTypeName: '',
                    extPowerRating: String(power || 1),
                    extCardSubtype: '',
                    extFlavorText: '',
                    extDefensePower: '',
                    extLife: String(life || 1),
                    setName: 'Token',
                    type: 'Minion' as any,
                    mana_cost: 0,
                    text: 'Token creature',
                    elements: elements || [],
                    power: power || 1,
                    rarity: 'Ordinary' as any,
                    baseName: tokenName || 'Token',
                    cost: 0,
                    life: life || 1
                };
                
                const token: Unit = {
                    id: unitId,
                    card: tokenCard,
                    owner: casterId as 'player1' | 'player2',
                    position: target.position,
                    region: 'surface',
                    isTapped: false,
                    damage: 0,
                    summoning_sickness: true,
                    artifacts: [],
                    modifiers: [],
                    // Legacy compatibility properties
                    name: tokenName || 'Token',
                    power: power || 1,
                    life: life || 1,
                    canAct: false,
                    abilities: [],
                    elements: elements || [],
                    cost: 0
                };
                
                gameState.units.set(unitId, token);
                gameState.grid[target.position.x][target.position.y].units.push(token);
                
                events.push(this.createGameEvent(
                    'unit_summoned',
                    casterId as 'player1' | 'player2',
                    `Token ${tokenName} summoned at (${target.position.x}, ${target.position.y})`,
                    {
                        targetPosition: target.position,
                        data: {
                            unitId: unitId,
                            position: target.position,
                            summoner: casterId
                        }
                    }
                ));
            }
        }
        
        return { success: true, events, targetedItems: targets };
    }

    private executeModifyEffect(
        gameState: GameState, 
        effect: SpellEffect, 
        targets: SpellTarget[], 
        events: GameEvent[]
    ): SpellExecutionResult {
        const { powerBonus, lifeBonus, duration } = effect.parameters;
        
        for (const target of targets) {
            if (target.type === 'unit') {
                const unit = gameState.units.get(target.id);
                if (unit) {
                    // Add modifiers to the unit
                    if (powerBonus !== 0) {
                        unit.modifiers = unit.modifiers || [];
                        unit.modifiers.push({
                            type: 'power',
                            value: powerBonus,
                            source: 'spell',
                            duration: duration || 'permanent'
                        });
                    }
                    
                    if (lifeBonus !== 0) {
                        unit.modifiers = unit.modifiers || [];
                        unit.modifiers.push({
                            type: 'life',
                            value: lifeBonus,
                            source: 'spell',
                            duration: duration || 'permanent'
                        });
                    }
                    
                    events.push(this.createGameEvent(
                        'unit_modified',
                        casterId as 'player1' | 'player2',
                        `Unit ${target.id} modified: ${powerBonus > 0 ? '+' : ''}${powerBonus} power, ${lifeBonus > 0 ? '+' : ''}${lifeBonus} life`,
                        {
                            targetUnit: target.id,
                            data: {
                                unitId: target.id,
                                powerBonus,
                                lifeBonus,
                                duration
                            }
                        }
                    ));
                }
            }
        }
        
        return { success: true, events, targetedItems: targets };
    }

    private executeMoveEffect(
        gameState: GameState, 
        effect: SpellEffect, 
        targets: SpellTarget[], 
        events: GameEvent[]
    ): SpellExecutionResult {
        // Simplified move effect - would need more sophisticated targeting
        for (const target of targets) {
            if (target.type === 'unit') {
                // Implementation would depend on how destination is specified
                events.push({
                    type: 'unit_moved',
                    data: {
                        unitId: target.id,
                        newPosition: target.position
                    },
                    timestamp: Date.now()
                });
            }
        }
        
        return { success: true, events, targetedItems: targets };
    }

    private executeDestroyEffect(
        gameState: GameState, 
        effect: SpellEffect, 
        targets: SpellTarget[], 
        events: GameEvent[]
    ): SpellExecutionResult {
        for (const target of targets) {
            if (target.type === 'unit') {
                this.destroyUnit(gameState, target.id);
                events.push({
                    type: 'unit_destroyed',
                    data: { unitId: target.id, cause: 'spell' },
                    timestamp: Date.now()
                });
            }
        }
        
        return { success: true, events, targetedItems: targets };
    }

    private resolveTargets(
        gameState: GameState, 
        targetSpecs: TargetSpecification[], 
        providedTargets: SpellTarget[], 
        casterId: string
    ): SpellTarget[] {
        // For now, just return provided targets
        // In a full implementation, this would validate targets against specifications
        return providedTargets;
    }

    private checkCondition(gameState: GameState, condition: ConditionCheck, casterId: string): boolean {
        // Simplified condition checking
        // Would need more sophisticated implementation based on condition types
        return true;
    }

    private destroyUnit(gameState: GameState, unitId: string): void {
        const unit = gameState.units.get(unitId);
        if (!unit) return;
        
        // Clear from grid
        const gridSquare = gameState.grid[unit.position.x][unit.position.y];
        const unitIndex = gridSquare.units.findIndex(u => u.id === unitId);
        if (unitIndex >= 0) {
            gridSquare.units.splice(unitIndex, 1);
        }
        
        // Remove from units
        gameState.units.delete(unitId);
        
        // If it's a card, move to graveyard
        if (unit.card) {
            const owner = gameState.players[unit.owner];
            if (owner) {
                owner.cemetery.push(unit.card);
            }
        }
    }

    private findCardInGame(gameState: GameState, cardId: string): Card | null {
        for (const playerId of ['player1', 'player2'] as const) {
            const player = gameState.players[playerId];
            
            // Search in hand
            let card = [...player.hand.spells, ...player.hand.sites].find((c: Card) => c.name === cardId);
            if (card) return card;
            
            // Search in deck (if exists)
            if (player.deck && player.deck.length > 0) {
                card = player.deck.find((c: Card) => c.name === cardId);
                if (card) return card;
            }
            
            // Search in graveyard (if exists)
            if (player.graveyard && player.graveyard.length > 0) {
                card = player.graveyard.find((c: Card) => c.name === cardId);
                if (card) return card;
            }
            
            // Search in cemetery
            card = player.cemetery.find((c: Card) => c.name === cardId);
            if (card) return card;
        }
        return null;
    }

    /**
     * Helper to create properly formatted GameEvents
     */
    private createGameEvent(
        type: GameEvent['type'],
        activePlayer: 'player1' | 'player2',
        description: string,
        options: Partial<GameEvent> = {}
    ): GameEvent {
        return {
            id: `event_${Date.now()}_${Math.random()}`,
            type,
            activePlayer,
            description,
            resolved: true,
            timestamp: Date.now(),
            ...options
        };
    }
}
