import React, { useEffect, useState, useRef } from 'react';
import { GameSimulation } from '../../core/simulation/gameSimulation';
import { GameState } from '../../core/simulation/types';
import { Deck } from '../../types/Deck';
import { PlayerBoard } from './PlayerBoard';
import { GameControls } from './GameControls';
import { GameLog } from './GameLog';
import { GameEffects } from './GameEffects';
import { TurnTimer } from './TurnTimer';
import './GameBoard.css';

interface GameBoardProps {
  deck1: Deck;
  deck2: Deck;
  autoPlay?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ deck1, deck2, autoPlay = false }) => {
  const [simulation] = useState(() => new GameSimulation(deck1, deck2));
  const [gameState, setGameState] = useState<GameState>(simulation.getState());
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [possibleTargets, setPossibleTargets] = useState<string[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = simulation.subscribe((newState) => {
      setGameState({ ...newState });
    });

    return unsubscribe;
  }, [simulation]);

  useEffect(() => {
    if (isAutoPlaying && !gameState.winner) {
      const timer = setTimeout(() => {
        const actions = simulation.simulateTurn();
        actions.forEach((action, index) => {
          setTimeout(() => {
            simulation.executeAction(action);
          }, index * 500);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAutoPlaying, gameState.activePlayer, gameState.winner, simulation]);

  useEffect(() => {
    // Update possible targets when a card is selected
    if (selectedCard) {
      const targets = calculatePossibleTargets(selectedCard, gameState);
      setPossibleTargets(targets);
    } else {
      setPossibleTargets([]);
    }
  }, [selectedCard, gameState]);

  const calculatePossibleTargets = (cardId: string, state: GameState): string[] => {
    const player = state.activePlayer === 1 ? state.player1 : state.player2;
    const opponent = state.activePlayer === 1 ? state.player2 : state.player1;
    const card = player.hand.find(c => c.instanceId === cardId) || 
                 player.board.find(c => c.instanceId === cardId);

    if (!card) return [];

    const targets: string[] = [];

    // If it's a creature on board that can attack
    if (card.location === 'board' && !card.tapped && !card.summoningSickness) {
      targets.push('avatar');
      opponent.board.forEach(c => {
        if (!c.abilities?.includes('Stealth') || c.tapped) {
          targets.push(c.instanceId!);
        }
      });
    }

    // If it's a spell in hand
    if (card.location === 'hand' && card.type === 'Spell') {
      if (card.abilities?.includes('Damage')) {
        targets.push('avatar');
        opponent.board.forEach(c => targets.push(c.instanceId!));
      }
      if (card.abilities?.includes('Buff')) {
        player.board.forEach(c => targets.push(c.instanceId!));
      }
    }

    return targets;
  };

  const handleCardClick = (cardId: string, location: string) => {
    if (location === 'hand' && gameState.activePlayer === 1) {
      if (selectedCard === cardId) {
        // Play the card
        simulation.executeAction({
          type: 'play_card',
          playerId: 1,
          cardId,
          timestamp: Date.now()
        });
        setSelectedCard(null);
      } else {
        setSelectedCard(cardId);
      }
    } else if (location === 'board' && selectedCard) {
      // Attack
      simulation.executeAction({
        type: 'attack',
        playerId: 1,
        attackerId: selectedCard,
        targetId: cardId,
        timestamp: Date.now()
      });
      setSelectedCard(null);
    }
  };

  const handleAvatarClick = (playerId: 1 | 2) => {
    if (selectedCard && playerId !== gameState.activePlayer) {
      simulation.executeAction({
        type: 'attack',
        playerId: gameState.activePlayer,
        attackerId: selectedCard,
        targetId: 'avatar',
        timestamp: Date.now()
      });
      setSelectedCard(null);
    }
  };

  const handlePlaySite = () => {
    simulation.executeAction({
      type: 'play_site',
      playerId: gameState.activePlayer,
      timestamp: Date.now()
    });
  };

  const handleEndTurn = () => {
    simulation.executeAction({
      type: 'end_turn',
      playerId: gameState.activePlayer,
      timestamp: Date.now()
    });
    setSelectedCard(null);
  };

  return (
    <div className="game-board" ref={boardRef}>
      <div className="game-area">
        <PlayerBoard
          player={gameState.player2}
          isActive={gameState.activePlayer === 2}
          isOpponent={true}
          onCardClick={handleCardClick}
          onAvatarClick={() => handleAvatarClick(2)}
          selectedCard={selectedCard}
          hoveredCard={hoveredCard}
          onCardHover={setHoveredCard}
          possibleTargets={possibleTargets}
        />
        
        <div className="board-separator">
          <div className="turn-indicator">
            Turn {gameState.currentTurn} - {gameState.activePlayer === 1 ? 'Your' : "Opponent's"} Turn
          </div>
          <TurnTimer 
            duration={90} 
            onTimeout={handleEndTurn}
            isPaused={gameState.winner !== null}
          />
        </div>

        <PlayerBoard
          player={gameState.player1}
          isActive={gameState.activePlayer === 1}
          isOpponent={false}
          onCardClick={handleCardClick}
          onAvatarClick={() => handleAvatarClick(1)}
          selectedCard={selectedCard}
          hoveredCard={hoveredCard}
          onCardHover={setHoveredCard}
          possibleTargets={possibleTargets}
        />
      </div>

      <div className="game-sidebar">
        <GameControls
          canPlaySite={!gameState.player1.hasPlayedSite && gameState.player1.sites.length > 0}
          canEndTurn={gameState.activePlayer === 1}
          onPlaySite={handlePlaySite}
          onEndTurn={handleEndTurn}
          onToggleAutoPlay={() => setIsAutoPlaying(!isAutoPlaying)}
          isAutoPlaying={isAutoPlaying}
          player={gameState.player1}
        />
        
        <GameLog
          lastAction={gameState.lastAction}
          winner={gameState.winner}
          actionHistory={simulation.getActionHistory()}
        />
      </div>

      <GameEffects lastAction={gameState.lastAction} boardRef={boardRef} />

      {gameState.winner && (
        <div className="game-over-overlay">
          <motion.div 
            className="game-over-message"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <h1>Victory!</h1>
            <p>Player {gameState.winner} Wins!</p>
            <button onClick={() => window.location.reload()}>
              Play Again
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
