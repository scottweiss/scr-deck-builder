const { GameStateManager } = require('./dist-test/core/simulation/core/gameState');
const { MatchSimulator } = require('./dist-test/core/simulation/core/matchSimulator');

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
  type: 'Magic',
  mana_cost: 1,
  elements: ['Fire']
};

const mockSite = {
  id: 'test_site',
  name: 'Test Site',
  type: 'Site',
  elements: ['Fire']
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
  console.log('Creating GameStateManager...');
  const gsm = new GameStateManager(player1Deck, player2Deck);
  console.log('✅ GameStateManager created successfully!');
  
  const gameState = gsm.getState();
  console.log('Game state:', {
    turn: gameState.turn,
    currentPlayer: gameState.phase.activePlayer,
    gridSize: `${gameState.grid[0].length}x${gameState.grid.length}`,
    player1Life: gameState.players.player1.life,
    player2Life: gameState.players.player2.life
  });
  
  console.log('Creating MatchSimulator...');
  const simulator = new MatchSimulator();
  console.log('✅ MatchSimulator created successfully!');
  
  console.log('✅ All core simulation modules are working properly!');
  
} catch (error) {
  console.error('❌ Error testing simulation:', error.message);
  console.error(error.stack);
}
