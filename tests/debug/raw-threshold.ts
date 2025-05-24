// Simple script to extract threshold data from raw CSV

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { parseThreshold } from '../src/utils/utils';

console.log("Testing threshold parsing from raw CSV...");

// Read the CSV data
const betaFilePath = './src/data/raw/BetaProductsAndPrices.csv';
const rawCsvData = fs.readFileSync(betaFilePath, 'utf8');

// Parse the CSV data
const records = parse(rawCsvData, {
  columns: true,
  skip_empty_lines: true
});

// Find cards with threshold data
const cardsWithThreshold = records.filter((record: any) => 
  record.extThreshold && record.extThreshold.trim() !== ''
);

console.log(`Found ${cardsWithThreshold.length} cards with thresholds in raw CSV data`);

// Print some examples
console.log("\nSample Cards with Thresholds:");
cardsWithThreshold.slice(0, 10).forEach((card: any) => {
  console.log(`\n${card.name}:`);
  console.log(`  Raw extThreshold: "${card.extThreshold}"`);
  
  const parsed = parseThreshold(card.extThreshold);
  console.log(`  Parsed threshold:`, parsed);
});

// Count thresholds by element
const elementCounts: Record<string, number> = {};
cardsWithThreshold.forEach((card: any) => {
  const parsed = parseThreshold(card.extThreshold);
  
  Object.entries(parsed).forEach(([element, count]) => {
    elementCounts[element] = (elementCounts[element] || 0) + 1;
  });
});

console.log("\nElements in threshold requirements:");
Object.entries(elementCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([element, count]) => {
    console.log(`  ${element}: ${count} cards`);
  });
