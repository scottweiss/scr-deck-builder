import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TurnTimerProps {
  duration: number;
  onTimeout: () => void;
  isPaused: boolean;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({ duration, onTimeout, isPaused }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeout();
          return duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration, onTimeout, isPaused]);

  const percentage = (timeLeft / duration) * 100;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="turn-timer">
      <div className="timer-display">
        <motion.div
          className={`timer-text ${isLowTime ? 'low-time' : ''}`}
          animate={isLowTime ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {timeLeft}s
        </motion.div>
      </div>
      <div className="timer-bar">
        <motion.div
          className="timer-fill"
          style={{ width: `${percentage}%` }}
          animate={{ 
            backgroundColor: isLowTime ? '#e74c3c' : '#3498db'
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};
