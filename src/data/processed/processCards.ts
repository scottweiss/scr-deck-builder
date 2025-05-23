import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Card, Element, CardType, CardRarity } from '../../types/Card';

/**
 * Processing statistics interface
 */
interface ProcessingStats {
    beta: number;
    arthurian: number;
    foils: number;
    boosters: number;
    total: number;
}

/**
 * Raw card data from CSV
 */
interface RawCard {
    productId?: string;
    name?: string;
    cleanName?: string;
    imageUrl?: string;
    categoryId?: string;
    groupId?: string;
    url?: string;
    modifiedOn?: string;
    imageCount?: string;
    extRarity?: string;
    extDescription?: string;
    extCost?: string;
    extThreshold?: string;
    extElement?: string;
    extCardType?: string;
    marketPrice?: string;
    subTypeName?: string;
    setName?: string;
    // Added missing fields based on usage
    extCardSubtype?: string;
    extTypeLine?: string;
    extCardCategory?: string;
    extPowerRating?: string;
    extFlavorText?: string;
    extDefensePower?: string;
    extLife?: string;
    lowPrice?: string;
    midPrice?: string;
    highPrice?: string;
    directLowPrice?: string;
}

/**
 * Card collection with utility methods
 */
export interface CardCollection {
    SORCERY_CARDS: Card[];
    getCardCount: () => number;
    getBetaCards: () => Card[];
    getArthurianCards: () => Card[];
    getCardsBySet: (setName: string) => Card[];
    getAllCards: () => Card[];
}

const csvFiles = [
    './BetaProductsAndPrices.csv',
    './ArthurianLegendsProductsAndPrices.csv'
];

let allCards: Card[] = [];
let stats: ProcessingStats = { beta: 0, arthurian: 0, foils: 0, boosters: 0, total: 0 };

console.log('Processing CSV files to create consolidated card data...');

for (const csvFile of csvFiles) {
    try {
        console.log(`Processing: ${csvFile}`);
        const fileContent = fs.readFileSync(csvFile, 'utf8');
        
        // Skip the first line if it starts with //
        const csvContent = fileContent.startsWith('//')
            ? fileContent.split('\n').slice(1).join('\n')
            : fileContent;
            
        const cards: RawCard[] = parse(csvContent, {
            columns: true,
            skip_empty_lines: true
        });
        
        stats.total += cards.length;
        
        // Enhanced filtering: exclude foils, boosters, and preconstructed products
        const filteredCards = cards.filter(card => {
            // Skip foil cards
            if (card.subTypeName === 'Foil' || 
                (card.cleanName || '').toLowerCase().includes('foil')) {
                stats.foils++;
                return false;
            }

            // Skip boosters and sealed products
            const name = (card.name || '').toLowerCase();
            const cleanName = (card.cleanName || '').toLowerCase();
            
            if (name.includes('booster') || 
                cleanName.includes('booster') || 
                name.includes('pack') || 
                name.includes('box') || 
                name.includes('case')) {
                stats.boosters++;
                return false;
            }

            // Skip preconstructed decks
            if (name.includes('preconstructed') || 
                name.includes('precon deck') ||
                cleanName.includes('preconstructed') || 
                cleanName.includes('precon deck')) {
                return false;
            }

            // Include cards with card type or in category 77 (excluding problematic products)
            return card.extCardType ||
                (card.categoryId === '77' && 
                 !['Booster Box', 'Booster Case', 'Booster Pack', 'Preconstructed'].some(term => 
                    (card.cleanName || '').includes(term)
                 )
                );
        });

        // Add set identifier and convert to Card format
        const setName = csvFile.includes('Beta') ? 'Beta' : 'ArthurianLegends';
        const processedCards = filteredCards.map(card => {
            const processedCard: Partial<Card> = {
                productId: card.productId,
                name: card.name || '',
                cleanName: card.cleanName,
                baseName: card.cleanName || card.name || '',
                imageUrl: card.imageUrl,
                categoryId: card.categoryId,
                groupId: card.groupId,
                url: card.url,
                modifiedOn: card.modifiedOn,
                imageCount: card.imageCount, // Keep as string, or ensure Card.imageCount is number
                rarity: card.extRarity as CardRarity, // Cast to CardRarity
                text: card.extDescription,
                extDescription: card.extDescription,
                mana_cost: card.extCost ? parseInt(card.extCost, 10) : 0,
                threshold: card.extThreshold,
                elements: card.extElement ? [card.extElement as Element] : [],
                type: card.extCardType as CardType,
                marketPrice: card.marketPrice, // Keep as string, or ensure Card.marketPrice is number
                subTypeName: card.subTypeName,
                setName: setName,
                // Required fields for Card interface
                power: 0, // Default power
                extRarity: card.extRarity || '',
                extCost: card.extCost || '',
                extThreshold: card.extThreshold || '',
                extElement: card.extElement || '',
                extCardType: card.extCardType || '',
                extCardSubtype: card.extCardSubtype || '',
                extTypeLine: card.extTypeLine || '',
                extCardCategory: card.extCardCategory || '',
                extPowerRating: card.extPowerRating || '',
                extFlavorText: card.extFlavorText || '',
                extDefensePower: card.extDefensePower || '',
                extLife: card.extLife || '',
                lowPrice: card.lowPrice || '',
                midPrice: card.midPrice || '',
                highPrice: card.highPrice || '',
                directLowPrice: card.directLowPrice || ''
            };
            return processedCard as Card;
        });
        
        allCards = [...allCards, ...processedCards];
        
        if (csvFile.includes('Beta')) {
            stats.beta = processedCards.length;
        } else {
            stats.arthurian = processedCards.length;
        }
        
        console.log(`Filtered cards from ${csvFile}: ${processedCards.length}`);
    } catch (error) {
        console.error(`Error reading from ${csvFile}: ${(error as Error).message}`);
    }
}

console.log('\nStatistics:');
console.log(`Total raw records: ${stats.total}`);
console.log(`Beta cards: ${stats.beta}`);
console.log(`Arthurian cards: ${stats.arthurian}`);
console.log(`Foils filtered: ${stats.foils}`);
console.log(`Boosters filtered: ${stats.boosters}`);
console.log(`Final card count: ${allCards.length}`);

// Create the JavaScript file with the consolidated data
const jsContent = `/**
 * Consolidated Sorcery Trading Card Game Data
 *
 * This file contains the combined data from BetaProductsAndPrices.csv and ArthurianLegendsProductsAndPrices.csv
 * Pre-filtered to exclude foil cards, booster products, and preconstructed decks
 * 
 * Generated: ${new Date().toISOString()}
 * 
 * Statistics:
 * - Beta cards: ${stats.beta}
 * - Arthurian Legends cards: ${stats.arthurian}
 * - Total cards: ${allCards.length}
 * - Foils filtered: ${stats.foils}
 * - Boosters filtered: ${stats.boosters}
 */

const SORCERY_CARDS = ${JSON.stringify(allCards, null, 2)};

module.exports = {
    SORCERY_CARDS,
    getCardCount: () => SORCERY_CARDS.length,
    getBetaCards: () => SORCERY_CARDS.filter(card => card.setName === 'Beta'),
    getArthurianCards: () => SORCERY_CARDS.filter(card => card.setName === 'ArthurianLegends'),
    getCardsBySet: (setName) => SORCERY_CARDS.filter(card => card.setName === setName),
    getAllCards: () => SORCERY_CARDS
};
`;

fs.writeFileSync('./sorceryCards.js', jsContent);
console.log('\nSuccessfully created sorceryCards.js');
console.log(`File size: ${(fs.statSync('./sorceryCards.js').size / 1024 / 1024).toFixed(2)} MB`);

console.log('\nFirst card sample:');
if (allCards.length > 0) {
    console.log(JSON.stringify(allCards[0], null, 2));
}

/**
 * Export the processed card collection
 */
export const cardCollection: CardCollection = {
    SORCERY_CARDS: allCards,
    getCardCount: () => allCards.length,
    getBetaCards: () => allCards.filter(card => card.setName === 'Beta'),
    getArthurianCards: () => allCards.filter(card => card.setName === 'ArthurianLegends'),
    getCardsBySet: (setName: string) => allCards.filter(card => card.setName === setName),
    getAllCards: () => allCards
};
