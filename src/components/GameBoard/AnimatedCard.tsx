import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardInPlay } from '../../core/simulation/types';
import { CardDisplay } from './CardDisplay';

interface AnimatedCardProps {
  card: CardInPlay;
  onClick: () => void;
  isSelected?: boolean;
  isTapped?: boolean;
  isPlayable?: boolean;
  canAttack?: boolean;
  isDragging?: boolean;
  isTarget?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  card,
  onClick,
  isSelected,
  isTapped,
  isPlayable,
  canAttack,
  isDragging,
  isTarget
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    initial: { scale: 0, rotateY: 180 },
    animate: { 
      scale: 1, 
      rotateY: 0,
      transition: { duration: 0.5, type: "spring", stiffness: 200 }
    },
    hover: { 
      scale: 1.05, 
      y: -10,
      transition: { duration: 0.2 }
    },
    selected: { 
      scale: 1.1, 
      y: -20,
      boxShadow: "0 10px 30px rgba(255, 204, 0, 0.8)",
      transition: { duration: 0.2 }
    },
    tapped: { 
      rotate: 90,
      transition: { duration: 0.3 }
    },
    dragging: {
      scale: 1.2,
      rotate: 5,
      zIndex: 1000
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const glowVariants = {
    playable: {
      boxShadow: [
        "0 0 10px rgba(74, 144, 226, 0.5)",
        "0 0 20px rgba(74, 144, 226, 0.8)",
        "0 0 10px rgba(74, 144, 226, 0.5)"
      ],
      transition: { duration: 2, repeat: Infinity }
    },
    canAttack: {
      boxShadow: [
        "0 0 10px rgba(231, 76, 60, 0.5)",
        "0 0 20px rgba(231, 76, 60, 0.8)",
        "0 0 10px rgba(231, 76, 60, 0.5)"
      ],
      transition: { duration: 1.5, repeat: Infinity }
    },
    target: {
      boxShadow: [
        "0 0 15px rgba(255, 255, 0, 0.6)",
        "0 0 25px rgba(255, 255, 0, 0.9)",
        "0 0 15px rgba(255, 255, 0, 0.6)"
      ],
      transition: { duration: 1, repeat: Infinity }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={card.instanceId}
        initial="initial"
        animate={[
          "animate",
          isSelected && "selected",
          isTapped && "tapped",
          isDragging && "dragging",
          isHovered && !isSelected && "hover"
        ].filter(Boolean)}
        exit="exit"
        variants={variants}
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{ cursor: 'pointer' }}
      >
        <motion.div
          animate={
            isPlayable ? "playable" :
            canAttack ? "canAttack" :
            isTarget ? "target" : {}
          }
          variants={glowVariants}
        >
          <CardDisplay
            card={card}
            onClick={onClick}
            isSelected={isSelected}
            isTapped={isTapped}
            isPlayable={isPlayable}
            canAttack={canAttack}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
