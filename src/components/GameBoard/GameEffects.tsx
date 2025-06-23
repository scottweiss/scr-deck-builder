import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameAction } from '../../core/simulation/types';
import { DamageAnimation } from './DamageAnimation';

interface GameEffectsProps {
  lastAction: GameAction | null;
  boardRef: React.RefObject<HTMLDivElement>;
}

interface Effect {
  id: string;
  type: 'damage' | 'spell' | 'ability';
  value?: number;
  x: number;
  y: number;
}

export const GameEffects: React.FC<GameEffectsProps> = ({ lastAction, boardRef }) => {
  const [effects, setEffects] = useState<Effect[]>([]);

  useEffect(() => {
    if (!lastAction || !boardRef.current) return;

    // Create effects based on action type
    if (lastAction.type === 'attack' && lastAction.targetId) {
      // Find target element and create damage effect
      const targetElement = boardRef.current.querySelector(
        `[data-card-id="${lastAction.targetId}"]`
      );
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const boardRect = boardRef.current.getBoundingClientRect();
        
        const effect: Effect = {
          id: `effect-${Date.now()}`,
          type: 'damage',
          value: 3, // This should come from the actual damage dealt
          x: rect.left - boardRect.left + rect.width / 2,
          y: rect.top - boardRect.top + rect.height / 2
        };
        
        setEffects(prev => [...prev, effect]);
      }
    }

    if (lastAction.type === 'play_card') {
      // Create spell cast effect
      const effect: Effect = {
        id: `effect-${Date.now()}`,
        type: 'spell',
        x: boardRef.current.clientWidth / 2,
        y: boardRef.current.clientHeight / 2
      };
      
      setEffects(prev => [...prev, effect]);
    }
  }, [lastAction, boardRef]);

  const removeEffect = (id: string) => {
    setEffects(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="game-effects-layer">
      <AnimatePresence>
        {effects.map(effect => {
          switch (effect.type) {
            case 'damage':
              return (
                <DamageAnimation
                  key={effect.id}
                  damage={effect.value || 0}
                  x={effect.x}
                  y={effect.y}
                  onComplete={() => removeEffect(effect.id)}
                />
              );
            
            case 'spell':
              return (
                <motion.div
                  key={effect.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 2, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 360]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  onAnimationComplete={() => removeEffect(effect.id)}
                  style={{
                    position: 'absolute',
                    left: effect.x,
                    top: effect.y,
                    width: 100,
                    height: 100,
                    marginLeft: -50,
                    marginTop: -50,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(74,144,226,0.8) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }}
                />
              );
            
            default:
              return null;
          }
        })}
      </AnimatePresence>
    </div>
  );
};
