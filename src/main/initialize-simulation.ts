import { GameStateManager } from '../core/simulation/gameState';
import { DeckBuilder } from '../core/deck/deckBuilder';
import { SimulationTestFramework } from '../core/simulation/testFramework';
import { Card } from '../types/Card';
import { PlayerDeck } from '../types/Deck';

interface PlayerSetup {
    avatar: string;
    strategy?: string;
    element: string;
}

// Simple UUID generator without external dependency
function generateId(): string {
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

async function initializeNewSimulation(player1Setup: PlayerSetup, player2Setup: PlayerSetup): Promise<any> {
    console.log('TypeScript: Initializing simulation with:', player1Setup, player2Setup);

    // Using mock deck creation logic from testFramework as a placeholder
    const framework = new SimulationTestFramework();
    const mockPlayer1Deck = framework['createMockPlayerDeck']();
    mockPlayer1Deck.avatar.name = player1Setup.avatar;

    const mockPlayer2Deck = framework['createMockPlayerDeck']();
    mockPlayer2Deck.avatar.name = player2Setup.avatar;

    console.log('TypeScript: Mock decks created.');

    // Using mock game state creation logic from testFramework as a placeholder
    const initialGameState = framework['createMockGameState']();
    initialGameState.players.player1.avatar.name = player1Setup.avatar;
    initialGameState.players.player2.avatar.name = player2Setup.avatar;

    // Add storyline entries with valid event types and number timestamps
    const initialEvents = [
        {
            id: generateId(),
            type: 'spell_cast', // Using valid event type
            description: `Game started: ${player1Setup.avatar} (P1) vs ${player2Setup.avatar} (P2)`,
            timestamp: Date.now(), // Using number timestamp
            activePlayer: 'player1',
            resolved: true
        },
        {
            id: generateId(),
            type: 'spell_cast', // Using valid event type
            description: `P1 Element: ${player1Setup.element}, Strategy: ${player1Setup.strategy || 'Default'}`,
            timestamp: Date.now(),
            activePlayer: 'player1',
            resolved: true
        },
        {
            id: generateId(),
            type: 'spell_cast', // Using valid event type
            description: `P2 Element: ${player2Setup.element}, Strategy: ${player2Setup.strategy || 'Default'}`,
            timestamp: Date.now(),
            activePlayer: 'player2',
            resolved: true
        },
        {
            id: generateId(),
            type: 'spell_cast', // Using valid event type
            description: 'Turn 1 - Player 1 (Initial state)',
            timestamp: Date.now(),
            activePlayer: 'player1',
            resolved: false
        }
    ];

    initialGameState.storyline = initialEvents;

    console.log('TypeScript: Mock game state created.');

    return initialGameState;
}

// Main execution block when script is run directly
if (require.main === module) {
    (async () => {
        try {
            const p1SetupArg = process.argv[2];
            const p2SetupArg = process.argv[3];

            if (!p1SetupArg || !p2SetupArg) {
                console.error('Usage: node initialize-simulation.ts <player1SetupJson> <player2SetupJson>');
                process.exit(1);
            }

            const player1Setup: PlayerSetup = JSON.parse(p1SetupArg);
            const player2Setup: PlayerSetup = JSON.parse(p2SetupArg);

            const gameState = await initializeNewSimulation(player1Setup, player2Setup);
            process.stdout.write(JSON.stringify(gameState, null, 2));
        } catch (error) {
            console.error('Error during simulation initialization:', error);
            process.exit(1);
        }
    })();
}
