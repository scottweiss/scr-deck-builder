/**
 * Card Adapter - Provides utilities for converting between different Card type representations
 * and position conversion utilities
 */
import { Card as BaseCard, CardType, Element, CardRarity } from '../types/Card';
import { Card as SimulationCard } from '../types/card-types';
import { Card as GameCard } from '../types/game-types';
import { BoardPosition } from '../types/game-types';
import { Position, GridSquare } from '../core/simulation/core/gameState';

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

/**
 * Universal card converter - handles all card type conversions
 * This is a smart function that detects the input card type and converts it to the target type
 * @param card Any card-like object from any part of the codebase
 * @param targetType The desired output card type: 'base', 'sim', or 'game'
 */
export function convertCard(
  card: BaseCard | SimulationCard | GameCard | any, 
  targetType: 'base' | 'sim' | 'game'
): BaseCard | SimulationCard | GameCard {
  // Skip conversion if card is already the target type
  if ((targetType === 'base' && isBaseCard(card)) ||
      (targetType === 'sim' && isSimulationCard(card)) ||
      (targetType === 'game' && isGameCard(card))) {
    return card;
  }

  // Determine source type and convert accordingly
  if (isBaseCard(card)) {
    return targetType === 'sim' ? adaptBaseCardToSimCard(card) :
           targetType === 'game' ? adaptBaseCardToGameCard(card) : card;
  } else if (isSimulationCard(card)) {
    return targetType === 'base' ? adaptSimCardToBaseCard(card) as BaseCard :
           targetType === 'game' ? adaptSimCardToGameCard(card) : card;
  } else if (isGameCard(card)) {
    return targetType === 'base' ? adaptGameCardToBaseCard(card) as BaseCard :
           targetType === 'sim' ? adaptGameCardToSimCard(card) : card;
  }

  // If we can't determine the type but it's card-like, make a best effort
  if (isCardLike(card)) {
    return createCardFromGeneric(card, targetType);
  }
  
  // Return original if we cannot convert
  return card;
}

/**
 * Converts a BaseCard (from Card.ts) to a SimulationCard (from card-types.ts)
 */
export function adaptBaseCardToSimCard(baseCard: BaseCard): SimulationCard {
  return {
    id: baseCard.productId || `card_${Date.now()}`,
    name: baseCard.name || baseCard.cleanName || '',
    // Map CardType enum to string literal type
    type: mapCardTypeToSimType(baseCard.type),
    cost: baseCard.cost || baseCard.mana_cost || 0,
    effect: baseCard.text || '',
    keywords: baseCard.keywords || extractKeywordsFromText(baseCard.text || ''),
    subtypes: baseCard.subtype ? [baseCard.subtype] : []
  };
}

/**
 * Converts a SimulationCard (from card-types.ts) to a BaseCard (from Card.ts)
 * Note: This is a partial conversion as SimulationCard doesn't have all BaseCard properties
 */
export function adaptSimCardToBaseCard(simCard: SimulationCard): Partial<BaseCard> {
  return {
    productId: simCard.id,
    name: simCard.name,
    cleanName: simCard.name.toLowerCase().replace(/\s+/g, '_'),
    type: mapSimTypeToCardType(simCard.type),
    mana_cost: simCard.cost || 0,
    cost: simCard.cost || 0,
    text: simCard.effect || '',
    elements: [],  // We can't determine elements from SimulationCard
    power: 0,      // Default values
    rarity: CardRarity.Common,
    baseName: simCard.name,
    keywords: simCard.keywords || []
  };
}

/**
 * Converts a BaseCard to a GameCard (from game-types.ts)
 */
export function adaptBaseCardToGameCard(baseCard: BaseCard): GameCard {
  return {
    id: baseCard.productId || `card_${Date.now()}`,
    name: baseCard.name || baseCard.cleanName || '',
    type: mapCardTypeToSimType(baseCard.type),
    cost: baseCard.cost || baseCard.mana_cost || 0,
    effect: baseCard.text || '',
    keywords: baseCard.keywords || extractKeywordsFromText(baseCard.text || ''),
    subtypes: baseCard.subtype ? [baseCard.subtype] : []
  };
}

/**
 * Converts a SimulationCard to a GameCard
 * These are similar but might have slight differences
 */
export function adaptSimCardToGameCard(simCard: SimulationCard): GameCard {
  return {
    ...simCard // SimulationCard and GameCard have compatible interfaces
  };
}

/**
 * Converts a GameCard to a SimulationCard
 */
export function adaptGameCardToSimCard(gameCard: GameCard): SimulationCard {
  return {
    ...gameCard // They share the same structure
  };
}

/**
 * Converts a GameCard to a BaseCard
 */
export function adaptGameCardToBaseCard(gameCard: GameCard): Partial<BaseCard> {
  return {
    productId: gameCard.id,
    name: gameCard.name,
    cleanName: gameCard.name.toLowerCase().replace(/\s+/g, '_'),
    type: mapSimTypeToCardType(gameCard.type),
    mana_cost: gameCard.cost || 0,
    cost: gameCard.cost || 0,
    text: gameCard.effect || '',
    elements: [],  // Can't determine from GameCard
    power: 0,      // Default values
    rarity: CardRarity.Common,
    baseName: gameCard.name,
    keywords: gameCard.keywords || []
  };
}

/**
 * Create a card of the target type from a generic card-like object
 */
function createCardFromGeneric(card: any, targetType: 'base' | 'sim' | 'game'): any {
  if (targetType === 'base') {
    return {
      productId: card.id || card.productId || `card_${Date.now()}`,
      name: card.name || '',
      cleanName: (card.name || '').toLowerCase().replace(/\s+/g, '_'),
      type: getTypeFromCard(card),
      mana_cost: card.cost || card.mana_cost || 0,
      cost: card.cost || card.mana_cost || 0,
      text: card.effect || card.text || '',
      elements: card.elements || [],
      power: card.power || 0,
      rarity: card.rarity || CardRarity.Common,
      baseName: card.baseName || card.name || ''
    };
  } else if (targetType === 'sim' || targetType === 'game') {
    return {
      id: card.id || card.productId || `card_${Date.now()}`,
      name: card.name || '',
      type: mapCardTypeToSimString(getTypeFromCard(card)),
      cost: card.cost || card.mana_cost || 0,
      effect: card.effect || card.text || '',
      keywords: card.keywords || extractKeywordsFromText(card.effect || card.text || ''),
      subtypes: card.subtypes || (card.subtype ? [card.subtype] : [])
    };
  }
  return card;
}

/**
 * Determines if a card object is a BaseCard from Card.ts
 */
export function isBaseCard(card: any): card is BaseCard {
  return card && typeof card === 'object' && 
    ('productId' in card || 'extCardType' in card || 'mana_cost' in card) &&
    !('effect' in card && 'keywords' in card); // Not a SimulationCard
}

/**
 * Determines if a card object is a SimulationCard from card-types.ts
 */
export function isSimulationCard(card: any): card is SimulationCard {
  return card && typeof card === 'object' &&
    'id' in card && 'name' in card && 
    ('effect' in card || 'keywords' in card) &&
    typeof card.type === 'string' &&
    !('players' in card || 'grid' in card); // Not a GameState
}

/**
 * Determines if a card object is a GameCard from game-types.ts
 */
export function isGameCard(card: any): card is GameCard {
  return card && typeof card === 'object' &&
    'id' in card && 'name' in card && 
    ('effect' in card || 'type' in card) &&
    typeof card.type === 'string';
}

/**
 * Helper to get the card type from any card format
 */
function getTypeFromCard(card: any): CardType {
  if (typeof card.type === 'string') {
    // If it's a string, try to map it to CardType
    if (Object.values(CardType).includes(card.type)) {
      return card.type as CardType;
    }
    // Try to map from simulation type string to CardType
    return mapSimTypeToCardType(card.type);
  }
  return CardType.Unknown;
}

/**
 * Maps CardType enum to a string representation (for general use)
 */
function mapCardTypeToSimString(cardType: CardType): string {
  return mapCardTypeToSimType(cardType);
}

/**
 * Maps CardType enum to string literal type used in simulation
 */
function mapCardTypeToSimType(cardType: CardType): SimulationCard['type'] {
  const typeMap: Record<CardType, SimulationCard['type']> = {
    [CardType.Minion]: 'Creature',
    [CardType.Magic]: 'Instant',
    [CardType.Artifact]: 'Artifact',
    [CardType.Aura]: 'Enchantment',
    [CardType.Site]: 'Site',
    [CardType.Avatar]: 'Avatar',
    [CardType.Unknown]: 'Creature' // Default to creature for unknown
  };
  
  return typeMap[cardType] || 'Creature';
}

/**
 * Maps simulation type string to CardType enum
 */
function mapSimTypeToCardType(simType: SimulationCard['type']): CardType {
  const typeMap: Record<string, CardType> = {
    'Creature': CardType.Minion,
    'Instant': CardType.Magic,
    'Sorcery': CardType.Magic,
    'Enchantment': CardType.Aura,
    'Artifact': CardType.Artifact,
    'Site': CardType.Site,
    'Avatar': CardType.Avatar
  };
  
  return typeMap[simType as string] || CardType.Unknown;
}

/**
 * Extract keywords from card text
 */
function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];
  const keywordRegex = /\b(Airborne|Burrowing|Charge|Deathrite|Spellcaster|Stealth|Submerge|Voidwalk|Movement \+\d+|Ranged \d+|Lethal|Lance|Waterbound|Fire Affinity|Water Affinity|Earth Affinity|Air Affinity|Void Affinity|Swift|Aquatic)\b/g;
  const matches = text.match(keywordRegex);
  return matches || [];
}

/**
 * Convert a BoardPosition to Position
 * Used to convert between different position representations in the codebase
 */
export function boardPositionToPosition(boardPos: BoardPosition): Position {
  return {
    x: boardPos.col,
    y: boardPos.row
  };
}

/**
 * Convert a Position to BoardPosition
 * Used to convert between different position representations in the codebase
 */
export function positionToBoardPosition(pos: Position): BoardPosition {
  return { row: pos.y, col: pos.x };
}

/**
 * Converts a simple board format (Card | null)[][] to GridSquare[][]
 * Used to bridge between different GameState definitions
 * Automatically handles conversion from GameCard format to SimulationCard format
 */
export function convertSimpleBoardToGridSquare(
  simpleBoard: (any | null)[][],
  defaultRegion: 'void' | 'surface' | 'underground' | 'underwater' = 'void'
): GridSquare[][] {
  // First convert the board to SimulationCard format if needed
  const simBoard = simpleBoard.map(row => 
    row.map(card => {
      if (!card) return null;
      // If it's already a SimulationCard or similar, use it
      if (card.effect !== undefined || card.keywords !== undefined) {
        return card as SimulationCard;
      }
      // Otherwise convert from GameCard format
      return {
        id: card.id,
        name: card.name,
        type: mapCardTypeToSimString(card.type),
        cost: card.cost || 0,
        effect: card.effect || '',
        keywords: card.keywords || [],
        subtypes: card.subtypes || []
      } as SimulationCard;
    })
  );

  const gridBoard: GridSquare[][] = [];
  
  for (let y = 0; y < simBoard.length; y++) {
    gridBoard[y] = [];
    for (let x = 0; x < simBoard[y].length; x++) {
      const card = simBoard[y][x];
      gridBoard[y][x] = {
        position: { x, y },
        site: card?.type === 'Site' ? card : undefined,
        units: card && card.type !== 'Site' ? [{
          id: card.id || `unit_${x}_${y}`,
          card,
          owner: 'player1', // Default - would need more context to determine
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

/**
 * Converts GridSquare[][] back to simple board format (Card | null)[][]
 */
export function convertGridSquareToSimpleBoard(gridBoard: GridSquare[][]): (SimulationCard | null)[][] {
  const simpleBoard: (SimulationCard | null)[][] = [];
  
  for (let y = 0; y < gridBoard.length; y++) {
    simpleBoard[y] = [];
    for (let x = 0; x < gridBoard[y].length; x++) {
      const square = gridBoard[y][x];
      // Priority: site first, then first unit
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

/**
 * Convert GameCard board format to SimulationCard board format
 * This handles the conversion of Card arrays to proper SimulationCard format
 */
export function convertGameBoardToSimBoard(gameBoard: (GameCard | null)[][]): (SimulationCard | null)[][] {
  return gameBoard.map(row => 
    row.map(card => {
      if (!card) return null;
      // Convert GameCard to SimulationCard format
      return {
        id: card.id,
        name: card.name,
        type: mapCardTypeToSimString(card.type as any),
        cost: card.cost || 0,
        effect: card.effect || '',
        keywords: card.keywords || [],
        subtypes: card.subtypes || []
      } as SimulationCard;
    })
  );
}
