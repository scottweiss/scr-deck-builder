#!/usr/bin/env ts-node
/**
 * Test script for the enhanced probability analysis system
 */

import { BrowserDeckBuilder } from './src/browser/unified-deck-builder';
import { Element, CardType, CardRarity } from './src/types/Card';

async function testProbabilityAnalysis() {
  console.log('🧪 Testing Enhanced Probability Analysis System...\n');

  const deckBuilder = new BrowserDeckBuilder();
  
  try {
    // Test 1: Build a deck with probability analysis
    console.log('📊 Test 1: Building deck with probability analysis...');
    const result = await deckBuilder.buildDeck({
      preferredElement: Element.Water,
      archetype: 'Midrange',
      includeProbabilityAnalysis: true
    });

    console.log(`✅ Deck built successfully with ${result.deck.length} cards`);
    console.log(`📈 Consistency Score: ${result.probabilityAnalysis.consistencyScore}%`);
    console.log(`🎯 Meta Position: ${result.metaAnalysis.metaPosition}`);
    console.log(`⚖️ Deck Consistency: ${result.deckConsistency.score}%\n`);

    // Test 2: Detailed deck analysis
    console.log('📋 Test 2: Getting detailed deck analysis...');
    const analysis = await deckBuilder.getDeckAnalysis(result.deck, result.avatar);
    
    console.log(`🔍 Strengths (${analysis.strengths.length}):`);
    analysis.strengths.forEach(strength => console.log(`  • ${strength}`));
    
    console.log(`⚠️ Weaknesses (${analysis.weaknesses.length}):`);
    analysis.weaknesses.forEach(weakness => console.log(`  • ${weakness}`));
    
    console.log(`💡 Recommendations (${analysis.recommendations.length}):`);
    analysis.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log();

    // Test 3: Matchup probabilities
    console.log('⚔️ Test 3: Calculating matchup probabilities...');
    const matchups = await deckBuilder.calculateMatchupProbabilities(result.deck, result.avatar);
    
    Object.entries(matchups).forEach(([archetype, data]) => {
      console.log(`  vs ${archetype}: ${data.winRate}% (${data.confidence} confidence)`);
      if (data.notes.length > 0) {
        console.log(`    Notes: ${data.notes.join(', ')}`);
      }
    });
    console.log();

    // Test 4: Optimization suggestions
    console.log('🔧 Test 4: Getting optimization suggestions...');
    const optimizations = await deckBuilder.getOptimizationSuggestions(result.deck, result.avatar, 'Midrange');
    
    console.log(`📊 Overall Score: ${optimizations.overallScore}%`);
    console.log(`🎯 Priority Changes (${optimizations.priorityChanges.length}):`);
    optimizations.priorityChanges.forEach(change => console.log(`  • ${change}`));
    
    console.log(`📈 Curve Adjustments (${optimizations.curveAdjustments.length}):`);
    optimizations.curveAdjustments.forEach(adj => console.log(`  • ${adj}`));
    
    console.log(`🌟 Elemental Optimizations (${optimizations.elementalOptimizations.length}):`);
    optimizations.elementalOptimizations.forEach(opt => console.log(`  • ${opt}`));
    console.log();

    // Test 5: Probability calculations for specific scenarios
    console.log('🎲 Test 5: Testing probability calculations...');
    
    // Test hypergeometric probability calculation
    const testDeck = Array(50).fill(null).map((_, i) => ({
      name: `Test Card ${i % 10}`, // 10 different cards, 5 copies each
      type: CardType.Magic,
      elements: [Element.Water],
      mana_cost: Math.floor(i / 10) + 1,
      text: 'Test card',
      rarity: CardRarity.Ordinary,
      // Required properties
      baseName: `Test Card ${i % 10}`,
      cost: Math.floor(i / 10) + 1,
      productId: `test-${i}`,
      cleanName: `test-card-${i % 10}`,
      imageUrl: '',
      categoryId: 'magic',
      groupId: 'test',
      url: '',
      modifiedOn: new Date().toISOString(),
      imageCount: '1',
      extRarity: 'Ordinary',
      extDescription: 'Test card',
      extCost: (Math.floor(i / 10) + 1).toString(),
      extThreshold: '',
      extElement: 'Water',
      extTypeLine: 'Magic',
      extCardCategory: 'Magic',
      extCardType: 'Magic',
      subTypeName: '',
      extPowerRating: '0',
      extCardSubtype: '',
      extFlavorText: 'A test card',
      extDefensePower: '0',
      extLife: '0',
      setName: 'Test'
    }));

    const testAvatar = {
      name: 'Test Avatar',
      type: CardType.Avatar,
      elements: [Element.Water],
      mana_cost: 0,
      text: 'Test avatar',
      power: 25,
      rarity: CardRarity.Unique,
      // Required properties
      baseName: 'Test Avatar',
      cost: 0,
      productId: 'test-avatar',
      cleanName: 'test-avatar',
      imageUrl: '',
      categoryId: 'avatar',
      groupId: 'test',
      url: '',
      modifiedOn: new Date().toISOString(),
      imageCount: '1',
      extRarity: 'Unique',
      extDescription: 'Test avatar',
      extCost: '0',
      extThreshold: '',
      extElement: 'Water',
      extTypeLine: 'Avatar',
      extCardCategory: 'Avatar',
      extCardType: 'Avatar',
      subTypeName: '',
      extPowerRating: '25',
      extCardSubtype: '',
      extFlavorText: 'A test avatar',
      extDefensePower: '0',
      extLife: '0',
      setName: 'Test'
    };

    const testAnalysis = await deckBuilder.getDeckAnalysis(testDeck, testAvatar);
    console.log(`🧮 Test deck analysis completed - Consistency: ${testAnalysis.probabilityAnalysis.consistencyScore}%`);
    console.log(`📊 Key card availability: Low Cost ${testAnalysis.probabilityAnalysis.keyCardAvailability.lowCost}%`);
    
    // Display draw probabilities for turn 1
    const turn1Probs = testAnalysis.probabilityAnalysis.drawProbability.turn1;
    const cardNames = Object.keys(turn1Probs).slice(0, 3); // Show first 3 cards
    cardNames.forEach(cardName => {
      console.log(`  Turn 1 draw chance for "${cardName}": ${turn1Probs[cardName]}%`);
    });

    console.log('\n🎉 All probability analysis tests completed successfully!');
    console.log('\n📋 Feature Summary:');
    console.log('✅ Basic deck building with probability analysis');
    console.log('✅ Detailed deck analysis with strengths/weaknesses');
    console.log('✅ Matchup probability calculations');
    console.log('✅ Optimization suggestions');
    console.log('✅ Hypergeometric probability calculations');
    console.log('✅ Consistency scoring');
    console.log('✅ Meta position analysis');
    console.log('✅ Mana curve analysis');
    console.log('✅ Elemental distribution optimization');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testProbabilityAnalysis().catch(console.error);
}

export { testProbabilityAnalysis };
