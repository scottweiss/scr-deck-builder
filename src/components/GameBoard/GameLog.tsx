import React from 'react';
import { GameAction } from '../../core/simulation/types';
import './GameLog.css';

interface GameLogProps {
  lastAction: GameAction | null;
  winner: 1 | 2 | null;
}

export const GameLog: React.FC<GameLogProps> = ({ lastAction, winner }) => {
  return (
    <div className="game-log">
      <h3>Game Log</h3>
      <div className="log-content">
        {winner && (
          <div className="log-entry winner">
            🏆 Player {winner} wins the game!
          </div>
        )}
        
        {lastAction && (
          <div className="log-entry">
            {lastAction.description || `Player ${lastAction.playerId} performed ${lastAction.type}`}
          </div>
        )}
      </div>
    </div>
  );
};
