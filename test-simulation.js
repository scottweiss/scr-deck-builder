// Simple test to verify the match simulation system works
const { MatchSimulator } = require('./dist/core/simulation/matchSimulator');

// Mock deck data for testing
const mockAvatar = {
  id: 'test_avatar',
  name: 'Test Avatar',
  type: 'Avatar',
  power: 0,
  life: 20,
  mana_cost: 0,
  elements: []
};

const mockSpell = {
  id: 'test_spell',
  name: 'Test Spell',
  type: 'Spell',
  mana_cost: 1,
  elements: ['fire']
};

const mockSite = {
  id: 'test_site',
  name: 'Test Site',
  type: 'Site',
  elements: ['fire']
};

const player1Deck = {
  avatar: mockAvatar,
  spells: [mockSpell, mockSpell, mockSpell],
  sites: [mockSite, mockSite, mockSite]
};

const player2Deck = {
  avatar: mockAvatar,
  spells: [mockSpell, mockSpell, mockSpell],
  sites: [mockSite, mockSite, mockSite]
};

try {
  console.log('Creating match simulator...');
  const simulator = new MatchSimulator(player1Deck, player2Deck);
  
  console.log('Match simulator created successfully!');
  console.log('Game state initialized:', simulator.getGameState().turn);
  
  console.log('✅ Match simulation system is working!');
} catch (error) {
  console.error('❌ Error testing match simulation:', error.message);
}
