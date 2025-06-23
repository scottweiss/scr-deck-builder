import React from 'react';
import './GameControls.css';

interface GameControlsProps {
  canPlaySite: boolean;
  canEndTurn: boolean;
  onPlaySite: () => void;
  onEndTurn: () => void;
  onToggleAutoPlay: () => void;
  isAutoPlaying: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  canPlaySite,
  canEndTurn,
  onPlaySite,
  onEndTurn,
  onToggleAutoPlay,
  isAutoPlaying
}) => {
  return (
    <div className="game-controls">
      <h3>Actions</h3>
      
      <button
        className="control-button play-site"
        onClick={onPlaySite}
        disabled={!canPlaySite}
      >
        Play Site
      </button>
      
      <button
        className="control-button end-turn"
        onClick={onEndTurn}
        disabled={!canEndTurn}
      >
        End Turn
      </button>
      
      <button
        className={`control-button auto-play ${isAutoPlaying ? 'active' : ''}`}
        onClick={onToggleAutoPlay}
      >
        {isAutoPlaying ? 'Stop Auto-Play' : 'Start Auto-Play'}
      </button>
    </div>
  );
};
