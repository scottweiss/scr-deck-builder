import React from 'react';
import { Avatar } from '../../types';
import './AvatarDisplay.css';

interface AvatarDisplayProps {
  avatar: Avatar;
  health: number;
  maxHealth: number;
  onClick: () => void;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar,
  health,
  maxHealth,
  onClick
}) => {
  const healthPercentage = (health / maxHealth) * 100;

  return (
    <div className="avatar-display" onClick={onClick}>
      <div className="avatar-image">
        <img src={avatar.image_url || '/avatar-placeholder.png'} alt={avatar.name} />
      </div>
      
      <div className="avatar-info">
        <h3>{avatar.name}</h3>
        <div className="avatar-elements">
          {avatar.elements.map((element, index) => (
            <span key={index} className={`element element-${element.toLowerCase()}`}>
              {element}
            </span>
          ))}
        </div>
      </div>
      
      <div className="health-bar">
        <div 
          className="health-fill" 
          style={{ width: `${healthPercentage}%` }}
        />
        <div className="health-text">
          {health} / {maxHealth}
        </div>
      </div>
    </div>
  );
};
