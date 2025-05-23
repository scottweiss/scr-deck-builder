import { getBetaCards } from '../src/data/processed/sorceryCards';
import { parseThreshold, getCardThreshold } from '../src/utils/utils';
import { Card } from '../src/types/Card';

async function testThresholds() {
    console.log("Testing threshold parsing...");

    // Get the card data
    const cards = await getBetaCards();

    // Find cards with threshold data
    const cardsWithThreshold = cards.filter((card: Card) => (card as any).extThreshold);

    // Print sample threshold data
    console.log(`Found ${cardsWithThreshold.length} cards with thresholds`);

    // Print some examples
    console.log("\nSample Cards with Thresholds:");
    cardsWithThreshold.slice(0, 10).forEach((card: Card) => {
        console.log(`\n${card.name}:`);
        console.log(`  Raw extThreshold: "${(card as any).extThreshold}"`);
        console.log(`  Assigned threshold: "${card.threshold}"`);
        
        const parsed = parseThreshold((card as any).extThreshold);
        console.log(`  Parsed threshold:`, parsed);
        
        const getThreshold = getCardThreshold(card);
        console.log(`  getCardThreshold result:`, getThreshold);
    });

        // Test if elementRequirementAnalyzer would find these
    console.log("\nSimulating elementRequirementAnalyzer...");

    // Mock the analyzer function (simplified version)
    function findThresholds(cards: Card[]) {
        const thresholds: Record<string, number> = {
            Water: 0,
            Fire: 0,
            Earth: 0,
            Air: 0,
            Void: 0
        };
        
        for (const card of cards) {
            const cardThresholds = getCardThreshold(card);
            
            for (const [element, amount] of Object.entries(cardThresholds)) {
                if (amount > (thresholds[element] || 0)) {
                    thresholds[element] = amount;
                }
            }
        }
        
        return thresholds;
    }

    const thresholdRequirements = findThresholds(cardsWithThreshold.slice(0, 20));
    console.log("Found threshold requirements:", thresholdRequirements);
}

// Call the async function
testThresholds().catch(console.error);
