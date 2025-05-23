// Test script for the deck builder with different archetypes
import { buildDeck } from './src/main/build-deck';

async function runDeckBuilder(element: string, archetype: string) {
  console.log(`=== Testing deck builder with ${element} element and ${archetype} archetype ===`);
  try {
    await buildDeck('Beta', element, archetype);
  } catch (error) {
    console.error(`Error running deck builder: ${error}`);
  }
  console.log('\n');
}

// Test different combinations of elements and archetypes
async function runTests() {
  await runDeckBuilder('Water', 'Aggro');
  await runDeckBuilder('Fire', 'Control');
  await runDeckBuilder('Earth', 'Combo');
  await runDeckBuilder('Air', 'Minion-Heavy');
  await runDeckBuilder('Void', 'Balanced');
}

runTests().catch(error => {
  console.error('Test execution error:', error);
});
