import React, { useState, useEffect } from 'react';
import { GameBoard } from '../components/GameBoard/GameBoard';
import { DeckBuilder } from '../core/deck/builder/deckBuilder';
import { Card, Avatar } from '../types';
import { Deck } from '../types/Deck';
import { getAllCards } from '../api/cards';
import { getAllAvatars } from '../api/avatars';

export const SimulationPage: React.FC = () => {
  const [deck1, setDeck1] = useState<Deck | null>(null);
  const [deck2, setDeck2] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDecks = async () => {
      try {
        const [cards, avatars] = await Promise.all([
          getAllCards(),
          getAllAvatars()
        ]);

        // Build two AI decks
        const avatar1 = avatars[0];
        const avatar2 = avatars[1];

        const deck1 = DeckBuilder.buildOptimizedDeck({
          availableCards: cards,
          avatar: avatar1,
          archetype: 'midrange'
        });

        const deck2 = DeckBuilder.buildOptimizedDeck({
          availableCards: cards,
          avatar: avatar2,
          archetype: 'control'
        });

        setDeck1(deck1);
        setDeck2(deck2);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load decks:', error);
        setLoading(false);
      }
    };

    loadDecks();
  }, []);

  if (loading) {
    return <div className="loading">Loading game data...</div>;
  }

  if (!deck1 || !deck2) {
    return <div className="error">Failed to load decks</div>;
  }

  return (
    <div className="simulation-page">
      <GameBoard deck1={deck1} deck2={deck2} autoPlay={true} />
    </div>
  );
};
