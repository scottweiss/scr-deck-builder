/**
 * Spell effect system for Sorcery: Contested Realm match simulation
 * Handles parsing and execution of spell effects
 */

import {
    SpellEffect,
    TargetSpecification,
    TargetRestriction,
    ConditionCheck,
    SpellTarget,
    SpellExecutionResult
} from '../types/spellEffectTypes';

import { GameState, Card, Unit, Position, GameEvent, Player } from './gameState';
import { spellParser } from './spellParser';

export class SpellEffectSystem {

    /**
     * Parses spell text and converts it to executable effects
     */
    public parseSpellText(spellText: string): SpellEffect[] {
        return spellParser.parseSpellText(spellText);
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
                return this.executeModifyEffect(gameState, effect, resolvedTargets, casterId, events);
            case 'move':
                return this.executeMoveEffect(gameState, effect, resolvedTargets, casterId, events);
            case 'destroy':
                return this.executeDestroyEffect(gameState, effect, resolvedTargets, casterId, events);
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
                    
                    events.push(this.createGameEvent(
                        'spell_damage',
                        casterId as 'player1' | 'player2',
                        `Spell dealt ${amount} damage to ${target.id}`,
                        {
                            targetUnit: target.id,
                            damage: amount
                        }
                    ));
                    
                    // Check if unit is destroyed
                    const unitLife = unit.card.life || unit.life || 0;
                    if (unit.damage >= unitLife) {
                        this.destroyUnit(gameState, target.id);
                        events.push(this.createGameEvent(
                            'unit_destroyed',
                            casterId as 'player1' | 'player2',
                            `Unit ${target.id} was destroyed by spell damage`,
                            {
                                targetUnit: target.id
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
                            damage: amount
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
                    unit.damage = Math.max(0, unit.damage - amount);
                    
                    events.push(this.createGameEvent(
                        'unit_healed',
                        casterId as 'player1' | 'player2',
                        `Unit ${target.id} was healed for ${amount}`,
                        {
                            targetUnit: target.id
                        }
                    ));
                }
            } else if (target.type === 'player') {
                const player = gameState.players[target.id as 'player1' | 'player2'];
                if (player) {
                    player.life = Math.min(player.maxLife, player.life + amount);
                    
                    events.push(this.createGameEvent(
                        'player_healed',
                        casterId as 'player1' | 'player2',
                        `Player ${target.id} was healed for ${amount}`,
                        {}
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
                    {}
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
                gameState.grid[target.position.y][target.position.x].units.push(token);
                
                events.push(this.createGameEvent(
                    'unit_summoned',
                    casterId as 'player1' | 'player2',
                    `Token ${tokenName} summoned at (${target.position.x}, ${target.position.y})`,
                    {
                        targetPosition: target.position
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
        casterId: string,
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
                            targetUnit: target.id
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
        casterId: string,
        events: GameEvent[]
    ): SpellExecutionResult {
        // Simplified move effect - would need more sophisticated targeting
        for (const target of targets) {
            if (target.type === 'unit') {
                // For now, just log the move event
                events.push(this.createGameEvent(
                    'unit_moved',
                    casterId as 'player1' | 'player2',
                    `Unit ${target.id} was moved`,
                    {
                        targetUnit: target.id
                    }
                ));
            }
        }
        
        return { success: true, events, targetedItems: targets };
    }

    private executeDestroyEffect(
        gameState: GameState, 
        effect: SpellEffect, 
        targets: SpellTarget[], 
        casterId: string,
        events: GameEvent[]
    ): SpellExecutionResult {
        for (const target of targets) {
            if (target.type === 'unit') {
                this.destroyUnit(gameState, target.id);
                events.push(this.createGameEvent(
                    'unit_destroyed',
                    casterId as 'player1' | 'player2',
                    `Unit ${target.id} was destroyed by spell`,
                    {
                        targetUnit: target.id
                    }
                ));
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
        const gridSquare = gameState.grid[unit.position.y][unit.position.x];
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
