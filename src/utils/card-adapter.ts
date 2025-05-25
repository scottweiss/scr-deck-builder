/**
 * Card Adapter - Provides utilities for converting between different Card type representations
 * and position conversion utilities
 */
import { Card, CardType, Element, CardRarity } from '../types/Card';
import { GridSquare } from '../core/simulation/core/gameState';

// Type guard that checks if an object is "card-like"
export function isCardLike(card: any): boolean {
  return card && typeof card === 'object' && (
    ('name' in card && (
      'type' in card || 
      'productId' in card ||
      'id' in card
    ))
  );
}

// --- Helpers still relevant for canonical Card type ---

/**
 * Extract keywords from card text
 */
export function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];
  const keywordRegex = /\b(Airborne|Burrowing|Charge|Deathrite|Spellcaster|Stealth|Submerge|Voidwalk|Movement \+\d+|Ranged \d+|Lethal|Lance|Waterbound|Fire Affinity|Water Affinity|Earth Affinity|Air Affinity|Void Affinity|Swift|Aquatic)\b/g;
  const matches = text.match(keywordRegex);
  return matches || [];
}

// --- Board conversion helpers (now use canonical Card type) ---

export function convertSimpleBoardToGridSquare(
  simpleBoard: (Card | null)[][],
  defaultRegion: 'void' | 'surface' | 'underground' | 'underwater' = 'void'
): GridSquare[][] {
  const gridBoard: GridSquare[][] = [];
  for (let y = 0; y < simpleBoard.length; y++) {
    gridBoard[y] = [];
    for (let x = 0; x < simpleBoard[y].length; x++) {
      const card = simpleBoard[y][x];
      gridBoard[y][x] = {
        position: { x, y },
        site: card?.type === 'Site' ? card : undefined,
        units: card && card.type !== 'Site' ? [{
          id: card.id || `unit_${x}_${y}`,
          card,
          owner: 'player1',
          position: { x, y },
          region: 'surface',
          isTapped: false,
          damage: 0,
          summoning_sickness: false,
          artifacts: [],
          modifiers: []
        }] : [],
        region: card ? 'surface' : defaultRegion,
        isRubble: false
      };
    }
  }
  return gridBoard;
}

export function convertGridSquareToSimpleBoard(gridBoard: GridSquare[][]): (Card | null)[][] {
  const simpleBoard: (Card | null)[][] = [];
  for (let y = 0; y < gridBoard.length; y++) {
    simpleBoard[y] = [];
    for (let x = 0; x < gridBoard[y].length; x++) {
      const square = gridBoard[y][x];
      if (square.site) {
        simpleBoard[y][x] = square.site;
      } else if (square.units.length > 0) {
        simpleBoard[y][x] = square.units[0].card;
      } else {
        simpleBoard[y][x] = null;
      }
    }
  }
  return simpleBoard;
}
