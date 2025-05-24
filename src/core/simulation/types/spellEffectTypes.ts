// Type and interface definitions for spell effect system
import { Position, GameEvent } from './gameState';

export interface SpellEffect {
    type: 'damage' | 'heal' | 'draw' | 'summon' | 'modify' | 'move' | 'destroy' | 'counter' | 'search' | 'custom';
    targets: TargetSpecification[];
    parameters: { [key: string]: any };
    conditions?: ConditionCheck[];
}

export interface TargetSpecification {
    type: 'unit' | 'player' | 'position' | 'card' | 'auto';
    count: number;
    restrictions: TargetRestriction[];
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
