/**
 * Processing configuration for Sorcery card data
 */

import path from 'path';

// Base paths
const RAW_DATA_DIR = path.join(__dirname, '..', 'raw');
const PROCESSED_DATA_DIR = path.join(__dirname);

// Input CSV files
export const CSV_FILES = [
    path.join(RAW_DATA_DIR, 'BetaProductsAndPrices.csv'),
    path.join(RAW_DATA_DIR, 'ArthurianLegendsProductsAndPrices.csv')
];

// Output files
export const OUTPUT_DATA_FILE = path.join(PROCESSED_DATA_DIR, 'sorceryCards.data.js');
export const OUTPUT_OPTIMIZED_FILE = path.join(PROCESSED_DATA_DIR, 'sorceryCards.generated.js');
export const OUTPUT_DOC_FILE = path.join(PROCESSED_DATA_DIR, 'CARD_DATA.md');

// The order of keys is important for the compression
export const CARD_KEYS = [
    "productId", "name", "cleanName", "imageUrl", "categoryId", 
    "groupId", "url", "modifiedOn", "imageCount", "extRarity", 
    "extDescription", "extCost", "extThreshold", "extElement", "extCardType",
    "subTypeName", "setName"
];

/**
 * Configuration interface for processing parameters
 */
export interface ProcessingConfig {
    csvFiles: string[];
    outputDataFile: string;
    outputOptimizedFile: string;
    outputDocFile: string;
    cardKeys: string[];
}

/**
 * Get the complete processing configuration
 */
export function getConfig(): ProcessingConfig {
    return {
        csvFiles: CSV_FILES,
        outputDataFile: OUTPUT_DATA_FILE,
        outputOptimizedFile: OUTPUT_OPTIMIZED_FILE,
        outputDocFile: OUTPUT_DOC_FILE,
        cardKeys: CARD_KEYS
    };
}
