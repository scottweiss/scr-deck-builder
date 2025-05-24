#!/usr/bin/env node

/**
 * Generate browser-compatible card data from CSV files
 * This script processes the real Sorcery card data and creates a JavaScript file
 * that can be used in the browser deck builder.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Paths to CSV files
const CSV_FILES = [
  '../../../src/data/raw/BetaProductsAndPrices.csv',
  '../../../src/data/raw/ArthurianLegendsProductsAndPrices.csv'
];

const OUTPUT_FILE = '../real-card-data.js';

// Element mapping from CSV notation to full names
const ELEMENT_MAP = {
  'W': 'Water',
  'F': 'Fire', 
  'E': 'Earth',
  'A': 'Air',
  'V': 'Void'
};

// Card type mapping
const CARD_TYPE_MAP = {
  'Minion': 'Minion',
  'Magic': 'Magic',
  'Artifact': 'Artifact',
  'Aura': 'Aura',
  'Site': 'Site',
  'Avatar': 'Avatar'
};

// Rarity mapping
const RARITY_MAP = {
  'Ordinary': 'Ordinary',
  'Exceptional': 'Exceptional', 
  'Elite': 'Elite',
  'Unique': 'Unique',
  'Common': 'Common'
};

/**
 * Parse threshold string like "WW" or "FF" into element requirements
 */
function parseThreshold(thresholdStr) {
  if (!thresholdStr) return {};
  
  const requirements = {};
  for (const char of thresholdStr.toUpperCase()) {
    if (ELEMENT_MAP[char]) {
      const element = ELEMENT_MAP[char];
      requirements[element] = (requirements[element] || 0) + 1;
    }
  }
  return requirements;
}

/**
 * Parse elements from element string
 */
function parseElements(elementStr) {
  if (!elementStr) return [];
  
  const elements = [];
  const chars = elementStr.split(',').join('').trim(); // Handle comma-separated or concatenated
  
  for (const char of chars.toUpperCase()) {
    if (ELEMENT_MAP[char] && !elements.includes(ELEMENT_MAP[char])) {
      elements.push(ELEMENT_MAP[char]);
    }
  }
  return elements;
}

/**
 * Determine archetype based on card properties
 */
function determineArchetype(card) {
  const text = (card.rule_text || '').toLowerCase();
  const cost = card.mana_cost;
  const type = card.type;
  
  const archetypes = [];
  
  // Aggro indicators
  if (cost <= 3 || text.includes('charge') || text.includes('haste') || text.includes('attack')) {
    archetypes.push('Aggro');
  }
  
  // Control indicators  
  if (cost >= 5 || text.includes('counter') || text.includes('destroy') || text.includes('return') || 
      text.includes('draw') || type === 'Magic') {
    archetypes.push('Control');
  }
  
  // Midrange indicators
  if (cost >= 3 && cost <= 5 && type === 'Minion') {
    archetypes.push('Midrange');
  }
  
  // Combo indicators
  if (text.includes('whenever') || text.includes('when') || text.includes('if')) {
    archetypes.push('Combo');
  }
  
  return archetypes.length > 0 ? archetypes : ['Midrange'];
}

/**
 * Transform raw CSV row to browser-compatible card
 */
function transformCard(rawCard) {
  // Skip foil cards and non-card products
  if (rawCard.name.includes('(Foil)') || 
      rawCard.name.includes('Booster') ||
      rawCard.name.includes('Pack') ||
      !rawCard.extCardType ||
      rawCard.extCardType === '') {
    return null;
  }
  
  const manaCost = rawCard.extCost === 'X' ? 0 : parseInt(rawCard.extCost) || 0;
  const cardType = CARD_TYPE_MAP[rawCard.extCardType] || rawCard.extCardType;
  const elements = parseElements(rawCard.extElement);
  const power = parseInt(rawCard.extPowerRating) || 0;
  const defense = parseInt(rawCard.extDefensePower) || undefined;
  const life = parseInt(rawCard.extLife) || undefined;
  const rarity = RARITY_MAP[rawCard.extRarity] || rawCard.extRarity;
  
  const card = {
    name: rawCard.name,
    type: cardType,
    elements: elements,
    mana_cost: manaCost,
    rule_text: rawCard.extDescription || '',
    power: power,
    defense: defense,
    life: life,
    rarity: rarity,
    set: rawCard.setName || 'Beta',
    subtype: rawCard.extCardSubtype || undefined,
    threshold: rawCard.extThreshold || '',
    thresholdRequirements: parseThreshold(rawCard.extThreshold),
    image_url: rawCard.imageUrl || ''
  };
  
  // Add archetype
  card.archetype = determineArchetype(card);
  
  // Add special properties for sites
  if (cardType === 'Site') {
    card.elementalAffinity = {};
    card.manaGeneration = 1; // Sites typically generate 1 mana
    
    // Sites provide affinity for their elements
    elements.forEach(element => {
      card.elementalAffinity[element] = 1;
    });
  }
  
  return card;
}

/**
 * Read and process CSV files
 */
function processCSVFiles() {
  console.log('Processing CSV files...');
  
  let allCards = [];
  
  for (const csvFile of CSV_FILES) {
    const csvPath = path.resolve(__dirname, csvFile);
    
    if (!fs.existsSync(csvPath)) {
      console.warn(`Warning: CSV file not found: ${csvPath}`);
      continue;
    }
    
    console.log(`Reading ${csvPath}...`);
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Parsed ${records.length} records from ${path.basename(csvPath)}`);
      
      // Add set name based on filename
      const setName = csvPath.includes('Beta') ? 'Beta' : 'ArthurianLegends';
      records.forEach(record => {
        record.setName = setName;
      });
      
      allCards = allCards.concat(records);
      
    } catch (error) {
      console.error(`Error parsing ${csvPath}:`, error);
    }
  }
  
  console.log(`Total raw records: ${allCards.length}`);
  
  // Transform cards
  const transformedCards = [];
  for (const rawCard of allCards) {
    const card = transformCard(rawCard);
    if (card) {
      transformedCards.push(card);
    }
  }
  
  console.log(`Transformed cards: ${transformedCards.length}`);
  
  // Generate statistics
  const stats = {
    totalCards: transformedCards.length,
    cardTypes: {},
    elements: {},
    rarities: {},
    sets: {},
    manaCurve: {}
  };
  
  transformedCards.forEach(card => {
    // Count by type
    stats.cardTypes[card.type] = (stats.cardTypes[card.type] || 0) + 1;
    
    // Count by rarity
    stats.rarities[card.rarity] = (stats.rarities[card.rarity] || 0) + 1;
    
    // Count by set
    stats.sets[card.set] = (stats.sets[card.set] || 0) + 1;
    
    // Count by mana cost
    stats.manaCurve[card.mana_cost] = (stats.manaCurve[card.mana_cost] || 0) + 1;
    
    // Count by elements
    card.elements.forEach(element => {
      stats.elements[element] = (stats.elements[element] || 0) + 1;
    });
  });
  
  console.log('\nCard Statistics:');
  console.log('Card Types:', stats.cardTypes);
  console.log('Elements:', stats.elements);
  console.log('Rarities:', stats.rarities);
  console.log('Sets:', stats.sets);
  console.log('Mana Curve:', stats.manaCurve);
  
  return { cards: transformedCards, stats };
}

/**
 * Generate the JavaScript file
 */
function generateCardDataFile(data) {
  const outputPath = path.resolve(__dirname, OUTPUT_FILE);
  
  const jsContent = `// Real Sorcery card data generated from CSV files
// Generated on: ${new Date().toISOString()}
// Total cards: ${data.cards.length}

// Card statistics
export const CARD_STATS = ${JSON.stringify(data.stats, null, 2)};

// All cards data
export const REAL_CARDS = ${JSON.stringify(data.cards, null, 2)};

// Helper functions for filtering cards
export function getCardsByType(type) {
  return REAL_CARDS.filter(card => card.type === type);
}

export function getCardsByElement(element) {
  return REAL_CARDS.filter(card => card.elements.includes(element));
}

export function getCardsByRarity(rarity) {
  return REAL_CARDS.filter(card => card.rarity === rarity);
}

export function getCardsBySet(set) {
  return REAL_CARDS.filter(card => card.set === set);
}

export function getCardsByManaCost(cost) {
  return REAL_CARDS.filter(card => card.mana_cost === cost);
}

export function searchCardsByName(query) {
  const lowerQuery = query.toLowerCase();
  return REAL_CARDS.filter(card => 
    card.name.toLowerCase().includes(lowerQuery)
  );
}

// Export default for easy import
export default REAL_CARDS;
`;

  fs.writeFileSync(outputPath, jsContent, 'utf8');
  console.log(`\nGenerated card data file: ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
}

// Main execution
function main() {
  console.log('🃏 Sorcery Card Data Generator');
  console.log('===============================\n');
  
  try {
    const data = processCSVFiles();
    generateCardDataFile(data);
    
    console.log('\n✅ Card data generation complete!');
    console.log(`Generated ${data.cards.length} cards from CSV files.`);
    
  } catch (error) {
    console.error('❌ Error generating card data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, processCSVFiles, generateCardDataFile };
