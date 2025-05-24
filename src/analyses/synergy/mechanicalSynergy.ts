import { Card } from '../../types/Card';
import { identifyCardMechanics } from '../../core/cards/cardAnalysis';

/**
 * Calculate mechanical synergy between a card and the current deck
 */
export function calculateMechanicSynergy(card: Card, deck: Card[]): number {
    const cardMechanics = identifyCardMechanics(card);
    let synergy = 0;

    // Look for complementary mechanics
    for (const deckCard of deck) {
        const deckCardMechanics = identifyCardMechanics(deckCard);

        // Card draw synergizes with resource production
        if (cardMechanics.drawsCards && deckCardMechanics.producesResources) {
            synergy += 2;
        }

        // Direct damage synergizes with control
        if (cardMechanics.dealsDirectDamage && deckCardMechanics.controlsMinions) {
            synergy += 1.5;
        }

        // AOE damage synergizes with defensive mechanics
        if (cardMechanics.dealsAOEDamage && deckCardMechanics.supportsDefense) {
            synergy += 1.5;
        }

        // Minion enhancement synergizes with charge/airborne
        if (cardMechanics.enhancesMinions && 
            (deckCardMechanics.hasCharge || deckCardMechanics.hasAirborne)) {
            synergy += 2;
        }

        // Combat keywords synergize with each other
        if ((cardMechanics.hasStrikeFirst || cardMechanics.hasLethal) && 
            (deckCardMechanics.hasStrikeFirst || deckCardMechanics.hasLethal)) {
            synergy += 1;
        }

        // Regional synergies
        if (cardMechanics.operatesUnderground && deckCardMechanics.operatesUnderground) {
            synergy += 2;
        }
        if (cardMechanics.operatesUnderwater && deckCardMechanics.operatesUnderwater) {
            synergy += 2;
        }
        if (cardMechanics.operatesVoid && deckCardMechanics.operatesVoid) {
            synergy += 2;
        }
    }

    return synergy;
}
