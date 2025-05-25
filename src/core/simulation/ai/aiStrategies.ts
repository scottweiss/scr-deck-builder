// aiStrategies.ts
// Central registry for all AI strategies in Sorcery TCG

import { AggressiveAIStrategy } from './strategies/aggressiveAI';
import { ControlAIStrategy } from './strategies/controlAI';
import { MidrangeAIStrategy } from './strategies/midrangeAI';
import { ComboAIStrategy } from './strategies/comboAI';
import type { AIStrategy } from './aiStrategy';

export const AI_STRATEGIES: Record<string, AIStrategy> = {
  AGGRESSIVE: new AggressiveAIStrategy(),
  CONTROL: new ControlAIStrategy(),
  MIDRANGE: new MidrangeAIStrategy(),
  COMBO: new ComboAIStrategy(),
};

export type AIStrategyName = keyof typeof AI_STRATEGIES;
export type { AIStrategy };
