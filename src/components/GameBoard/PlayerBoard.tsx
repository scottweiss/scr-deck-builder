import React from 'react';
import { PlayerState } from '../../core/simulation/types';
import { AnimatedCard } from './AnimatedCard';
import { AvatarDisplay } from './AvatarDisplay';
import './PlayerBoard.css';

interface PlayerBoardProps {
  player: PlayerState;
  isActive: boolean;
  isOpponent: boolean;
  onCardClick: (cardId: string, location: string) => void;
  onAvatarClick: () => void;
  selectedCard: string | null;
  hoveredCard: string | null;
  onCardHover: (cardId: string | null) => void;
  possibleTargets: string[];
}

export const PlayerBoard: React.FC<PlayerBoardProps> = ({
  player,
  isActive,
  isOpponent,
  onCardClick,
  onAvatarClick,
  selectedCard,
  hoveredCard,
  onCardHover,
  possibleTargets
}) => {
  return (
    <div className={`player-board ${isActive ? 'active' : ''} ${isOpponent ? 'opponent' : ''}`}>
      <div className="player-info">
        <AvatarDisplay
          avatar={player.avatar}
          health={player.health}
          maxHealth={player.maxHealth}
          onClick={onAvatarClick}
        />
        
        <div className="resource-display">
          <div className="mana-display">
            <span className="mana-current">{player.mana}</span>
            <span className="mana-separator">/</span>
            <span className="mana-max">{player.maxMana}</span>
          </div>
          
          {player.activeSite && (
            <div className="active-site">
              <h4>Active Site</h4>
              <div className="site-name">{player.activeSite.name}</div>
              <div className="site-elements">
                {player.activeSite.elements.join(', ')}
              </div>
            </div>
          )}
        </div>

        <div className="deck-counts">
          <div>Sites: {player.sites.length}</div>
          <div>Spellbook: {player.spellbook.length}</div>
        </div>
      </div>

      <div className="board-area">
        <h3>Battlefield</h3>
        <div className="creature-zone">
          {player.board.map((card) => (
            <div key={card.instanceId} data-card-id={card.instanceId}>
              <AnimatedCard
                card={card}
                onClick={() => onCardClick(card.instanceId!, 'board')}
                isSelected={selectedCard === card.instanceId}
                isTapped={card.tapped}
                canAttack={!card.tapped && !card.summoningSickness && isActive}
                isTarget={possibleTargets.includes(card.instanceId!)}
              />
            </div>
          ))}
        </div>
      </div>

      {!isOpponent && (
        <div className="hand-area">
          <h3>Hand ({player.hand.length})</h3>
          <div className="hand-cards">
            {player.hand.map((card) => (
              <AnimatedCard
                key={card.instanceId}
                card={card}
                onClick={() => onCardClick(card.instanceId!, 'hand')}
                isSelected={selectedCard === card.instanceId}
                isPlayable={isActive && player.mana >= (card.mana_cost || 0)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
