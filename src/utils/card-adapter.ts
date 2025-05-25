/**
 * Card Adapter - Provides utilities for converting between different Card type representations
 */
import { Card as BaseCard, CardType, Element } from '../types/Card';
import { Card as SimulationCard } from '../types/card-types';

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
    keywords: extractKeywordsFromText(baseCard.text || ''),
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
    cleanName: simCard.name,
    type: mapSimTypeToCardType(simCard.type),
    mana_cost: simCard.cost || 0,
    cost: simCard.cost || 0,
    text: simCard.effect || '',
    elements: [],  // We can't determine elements from SimulationCard
    power: 0,      // Default values
    rarity: undefined,
    baseName: simCard.name
  };
}

/**
 * Determines if a card object is a BaseCard from Card.ts
 */
export function isBaseCard(card: BaseCard | SimulationCard): card is BaseCard {
  return 'productId' in card || 'extCardType' in card || 'mana_cost' in card;
}

/**
 * Determines if a card object is a SimulationCard from card-types.ts
 */
export function isSimulationCard(card: BaseCard | SimulationCard): card is SimulationCard {
  return 'id' in card && ('effect' in card || 'keywords' in card); 
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
  const typeMap: Record<SimulationCard['type'], CardType> = {
    'Creature': CardType.Minion,
    'Instant': CardType.Magic,
    'Sorcery': CardType.Magic,
    'Enchantment': CardType.Aura,
    'Artifact': CardType.Artifact,
    'Site': CardType.Site,
    'Avatar': CardType.Avatar
  };
  
  return typeMap[simType] || CardType.Unknown;
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
