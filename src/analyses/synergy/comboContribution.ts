import { Card } from '../../types/Card';
import { identifyCardCombos } from '../../core/cards/cardCombos';

/**
 * Calculate how much a card would contribute to existing combos
 */
export function calculateComboContribution(card: Card, deck: Card[]): number {
    if (!card || !deck || deck.length === 0) return 0;
    
    const cardName = (card.baseName || card.name || '').toLowerCase();
    
    // Get existing combos in the deck
    const existingCombos = identifyCardCombos(deck);
    
    // Calculate potential new combos if we add this card
    const potentialCombos = identifyCardCombos([...deck, card]);
    
    let comboContribution = 0;
    
    // Check each potential combo to see if this card would complete or enhance it
    for (const potentialCombo of potentialCombos) {
        const comboCardNames = potentialCombo.cards.map(name => name.toLowerCase());
        
        // If this card is part of the combo
        if (comboCardNames.some(name => name === cardName)) {
            // Check if this is a new combo (not in existing combos)
            const isNewCombo = !existingCombos.some(existing => 
                existing.name === potentialCombo.name && 
                existing.cards.length === potentialCombo.cards.length - 1
            );
            
            if (isNewCombo) {
                // This card completes or significantly enhances a combo
                comboContribution += potentialCombo.synergy * 0.3; // 30% of combo synergy as contribution
            } else {
                // This card adds to an existing combo (more copies)
                comboContribution += potentialCombo.synergy * 0.1; // 10% for enhancing existing combo
            }
        }
    }
    
    return comboContribution;
}
