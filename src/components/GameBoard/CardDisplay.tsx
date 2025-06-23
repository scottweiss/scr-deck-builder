import React from 'react';
import { CardInPlay } from '../../core/simulation/types';
import './CardDisplay.css';

interface CardDisplayProps {
  card: CardInPlay;
  onClick: () => void;
  isSelected?: boolean;
  isTapped?: boolean;
  isPlayable?: boolean;
  canAttack?: boolean;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  onClick,
  isSelected = false,
  isTapped = false,
  isPlayable = false,
  canAttack = false
}) => {
  return (
    <div
      className={`card-display ${isSelected ? 'selected' : ''} ${isTapped ? 'tapped' : ''} ${isPlayable ? 'playable' : ''} ${canAttack ? 'can-attack' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        <span className="card-name">{card.name}</span>
        <span className="card-cost">{card.mana_cost || 0}</span>
      </div>
      
      <div className="card-image">
        <img src={card.image_url || '/placeholder.png'} alt={card.name} />
      </div>
      
      <div className="card-type">
        {card.type} - {card.subtype || 'None'}
      </div>
      
      <div className="card-text">
        {card.oracle_text}
      </div>
      
      {(card.attack !== undefined || card.defense !== undefined) && (
        <div className="card-stats">
          <span className="attack">{card.modifiedAttack || card.attack || 0}</span>
          <span className="separator">/</span>
          <span className="defense">
            {(card.modifiedHealth || card.health || 0) - (card.damage || 0)}
          </span>
        </div>
      )}
      
      <div className="card-elements">
        {card.elements.map((element, index) => (
          <span key={index} className={`element element-${element.toLowerCase()}`}>
            {element}
          </span>
        ))}
      </div>
    </div>
  );
};
