import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DamageAnimationProps {
  damage: number;
  x: number;
  y: number;
  onComplete: () => void;
}

export const DamageAnimation: React.FC<DamageAnimationProps> = ({
  damage,
  x,
  y,
  onComplete
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, x, y }}
        animate={{ 
          opacity: [0, 1, 1, 0],
          scale: [0.5, 1.5, 1.2, 1],
          y: y - 50
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        style={{
          position: 'absolute',
          fontSize: '48px',
          fontWeight: 'bold',
          color: damage > 0 ? '#e74c3c' : '#2ecc71',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          pointerEvents: 'none',
          zIndex: 1000
        }}
      >
        {damage > 0 ? `-${damage}` : `+${Math.abs(damage)}`}
      </motion.div>
    </AnimatePresence>
  );
};
