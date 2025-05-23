/**
 * Simple test to verify the new directory structure is working properly
 */

import path from 'path';

console.log('Checking module imports for the new directory structure...');

interface ModuleTest {
  name: string;
  path: string;
}

// List of all modules to check imports for
const modules: ModuleTest[] = [
  { name: 'Core Utils', path: '../utils/utils' },
  { name: 'Core Card Data', path: '../data/processed/sorceryCards' },
  { name: 'Deck Builder', path: '../core/deck/deckBuilder' },
  { name: 'Deck Optimizer', path: '../core/deck/deckOptimizer' },
  { name: 'Deck Exporter', path: '../core/deck/deckExporter' },
  { name: 'Card Analysis', path: '../core/cards/cardAnalysis' },
  { name: 'Card Combos', path: '../core/cards/cardCombos' },
  { name: 'Synergy Calculator', path: '../analyses/synergy/synergyCalculator' },
  { name: 'Deck Stats', path: '../analyses/synergy/deckStats' },
  { name: 'Deck Playability', path: '../analyses/playability/deckPlayability' },
  { name: 'Element Analyzer', path: '../analyses/position/elementRequirementAnalyzer' },
  { name: 'Site Selector', path: '../analyses/position/siteSelector' },
  { name: 'Rule Enforcer', path: '../core/rules/ruleEnforcer' }
];

// Try to import each module
let allSuccessful = true;

(async () => {
  for (const module of modules) {
    try {
      await import(module.path);
      console.log(`✅ Successfully imported ${module.name}`);
    } catch (error: any) {
      console.error(`❌ Failed to import ${module.name}: ${error.message}`);
      allSuccessful = false;
    }
  }

  if (allSuccessful) {
    console.log('\n✅ All modules imported successfully! The directory structure is working correctly.');
  } else {
    console.error('\n❌ Some imports failed. Please check the error messages above and fix the paths.');
  }
})();
