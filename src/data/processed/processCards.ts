/**
 * Advanced Card Processor with Compression
 * 
 * This script processes CSV files for Sorcery: Contested Realm and generates
 * optimized JavaScript data files for better performance.
 * 
 * Features:
 * - CSV data extraction and filtering
 * - Card data compression for reduced file size
 * - Generates two output files:
 *   1. sorceryCards.data.js - Compressed card data
 *   2. sorceryCards.optimized.js - Lazy loading wrapper
 */

import fs from 'fs';
import path from 'path';

import { parse } from 'csv-parse/sync';

import { getConfig } from './config';

/**
 * Statistics tracking interface
 */
interface Stats {
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
    [key: string]: any;
    subTypeName?: string;
    cleanName?: string;
    name?: string;
}

/**
 * Processed card with compression keys
 */
interface ProcessedCard {
    [key: string]: any;
}

// Import configuration
const config = getConfig();
const csvFiles = config.csvFiles;
const CARD_KEYS = config.cardKeys;

// Statistics tracking
let stats: Stats = { beta: 0, arthurian: 0, foils: 0, boosters: 0, total: 0 };

console.log('Processing CSV files to create optimized card data...');

// Process all cards from CSV files
let allCards: ProcessedCard[] = [];

// Ensure csvFiles is an array
const files = Array.isArray(csvFiles) ? csvFiles : [csvFiles];

for (const csvFile of files) {
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
            if (name.includes('booster') || 
                name.includes('display') ||
                name.includes('preconstructed deck') ||
                name.includes('promo pack')) {
                stats.boosters++;
                return false;
            }

            return true;
        });

        // Add source set information
        const setName = path.basename(csvFile).includes('Beta') ? 'Beta' : 'ArthurianLegends';
        
        // Update statistics
        if (setName === 'Beta') {
            stats.beta += filteredCards.length;
        } else {
            stats.arthurian += filteredCards.length;
        }
        
        // Add set name to each card
        filteredCards.forEach(card => {
            card.setName = setName;
        });
        
        // Add to all cards
        allCards = [...allCards, ...filteredCards];
        
        console.log(`Filtered cards from ${csvFile}: ${filteredCards.length}`);
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

/**
 * Compress card data by extracting values in a specific order
 */
function compressCard(card: RawCard): any[] {
    return CARD_KEYS.map(key => card[key] || null);
}

/**
 * Create compressed data structure
 */
const compressedData = {
    keys: CARD_KEYS,
    cards: allCards.map(compressCard),
    stats: {
        total: allCards.length,
        beta: stats.beta,
        arthurian: stats.arthurian,
        generated: new Date().toISOString()
    }
};

// Generate the compressed data file
const dataFileContent = `/**
 * Compressed Sorcery Trading Card Game Data
 * 
 * This file contains optimized card data with compression to reduce file size.
 * Data is stored as arrays with a key mapping for reconstruction.
 * 
 * Generated: ${new Date().toISOString()}
 * Total cards: ${allCards.length}
 * File size reduction: ~${Math.round((1 - JSON.stringify(compressedData).length / JSON.stringify(allCards).length) * 100)}%
 */

const COMPRESSED_CARD_DATA = ${JSON.stringify(compressedData, null, 2)};

module.exports = COMPRESSED_CARD_DATA;
`;

// Generate the optimized wrapper file
const optimizedFileContent = `/**
 * Optimized Sorcery Card Data Loader
 * 
 * This module provides lazy loading and caching for card data,
 * with automatic decompression from the compressed format.
 * 
 * Generated: ${new Date().toISOString()}
 */

const compressedData = require('./sorceryCards.data');

let cachedCards = null;

/**
 * Decompress a single card from array format back to object
 */
function decompressCard(cardArray) {
    const card = {};
    compressedData.keys.forEach((key, index) => {
        if (cardArray[index] !== null) {
            card[key] = cardArray[index];
        }
    });
    return card;
}

/**
 * Get all cards (lazy loaded and cached)
 */
function getAllCards() {
    if (!cachedCards) {
        console.log('Decompressing card data...');
        const startTime = Date.now();
        
        cachedCards = compressedData.cards.map(decompressCard);
        
        const endTime = Date.now();
        console.log(\`Decompressed \${cachedCards.length} cards in \${endTime - startTime}ms\`);
    }
    return cachedCards;
}

/**
 * Get cards filtered by set
 */
function getCardsBySet(setName) {
    return getAllCards().filter(card => card.setName === setName);
}

/**
 * Get card count without loading all data
 */
function getCardCount() {
    return compressedData.stats.total;
}

/**
 * Get statistics without loading all data
 */
function getStats() {
    return compressedData.stats;
}

module.exports = {
    getAllCards,
    getCardsBySet,
    getCardCount,
    getStats,
    getBetaCards: () => getCardsBySet('Beta'),
    getArthurianCards: () => getCardsBySet('ArthurianLegends')
};
`;

// Write the files
try {
    fs.writeFileSync(config.outputDataFile, dataFileContent);
    console.log(`\\nSuccessfully created ${path.basename(config.outputDataFile)}`);
    
    fs.writeFileSync(config.outputOptimizedFile, optimizedFileContent);
    console.log(`Successfully created ${path.basename(config.outputOptimizedFile)}`);
    
    // Calculate file sizes
    const dataSize = fs.statSync(config.outputDataFile).size;
    const optimizedSize = fs.statSync(config.outputOptimizedFile).size;
    
    console.log(`\\nFile sizes:`);
    console.log(`Data file: ${(dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Optimized wrapper: ${(optimizedSize / 1024).toFixed(2)} KB`);
    
    // Generate documentation
    const docContent = `# Sorcery Card Data Documentation

## Overview
This directory contains processed card data for Sorcery: Contested Realm.

## Files Generated
- \`sorceryCards.data.js\`: Compressed card data (\${(dataSize / 1024 / 1024).toFixed(2)} MB)
- \`sorceryCards.optimized.js\`: Lazy loading wrapper (\${(optimizedSize / 1024).toFixed(2)} KB)

## Statistics
- Total cards: \${stats.total} raw records processed
- Beta cards: \${stats.beta}
- Arthurian Legends cards: \${stats.arthurian}
- Final card count: \${allCards.length}
- Foil cards filtered: \${stats.foils}
- Booster products filtered: \${stats.boosters}

## Usage

\\\`\\\`\\\`javascript
const cardData = require('./sorceryCards.optimized');

// Get all cards (lazy loaded)
const allCards = cardData.getAllCards();

// Get cards by set
const betaCards = cardData.getBetaCards();
const arthurianCards = cardData.getArthurianCards();

// Get statistics without loading data
const stats = cardData.getStats();
console.log(\`Total cards: \${stats.total}\`);
\\\`\\\`\\\`

Generated: \${new Date().toISOString()}
`;

    fs.writeFileSync(config.outputDocFile, docContent);
    console.log(`Successfully created ${path.basename(config.outputDocFile)}`);
    
} catch (error) {
    console.error(`Error writing files: ${(error as Error).message}`);
    process.exit(1);
}

console.log('\\nOptimized card processing complete!');

// Sample card output
console.log('\\nFirst card sample:');
if (allCards.length > 0) {
    console.log(JSON.stringify(allCards[0], null, 2));
}
