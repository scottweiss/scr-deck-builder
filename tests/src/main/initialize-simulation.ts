import { GameStateManager, GameEvent } from '../../../src/core/simulation/core/gameState';
import { buildSpellbook, buildCompleteDeck } from '../../../src/core/deck/builder/deckBuilder';
import { SimulationTestFramework } from '../../../src/core/simulation/testing/testFramework';
import { Card } from '../../../src/types/Card';
import { PlayerDeck } from '../../../src/types/Deck';

interface PlayerSetup {
    avatar: string;
    strategy?: string;
    element: string;
}

// Simple UUID generator without external dependency
function generateId(): string {
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

// Helper function to log to stderr instead of stdout
function logToStderr(message: string): void {
    process.stderr.write(message + '\n');
}

async function initializeNewSimulation(player1Setup: PlayerSetup, player2Setup: PlayerSetup): Promise<any> {
    logToStderr('TypeScript: Initializing simulation with: ' + JSON.stringify(player1Setup) + ' ' + JSON.stringify(player2Setup));

    // Using mock deck creation logic from testFramework as a placeholder
    const framework = new SimulationTestFramework();
    const mockPlayer1Deck = framework['createMockPlayerDeck']();
    mockPlayer1Deck.avatar.name = player1Setup.avatar;

    const mockPlayer2Deck = framework['createMockPlayerDeck']();
    mockPlayer2Deck.avatar.name = player2Setup.avatar;

    logToStderr('TypeScript: Mock decks created.');

    // Using mock game state creation logic from testFramework as a placeholder
    const initialGameState = framework['createMockGameState']();
    initialGameState.players.player1.avatar.name = player1Setup.avatar;
    initialGameState.players.player2.avatar.name = player2Setup.avatar;

    // Add storyline entries with valid event types and proper structure
    const initialEvents: GameEvent[] = [
        {
            id: generateId(),
            type: 'spell_cast',
            description: `Game started: ${player1Setup.avatar} (P1) vs ${player2Setup.avatar} (P2)`,
            timestamp: Date.now(),
            activePlayer: 'player1',
            resolved: true
        },
        {
            id: generateId(),
            type: 'spell_cast',
            description: `P1 Element: ${player1Setup.element}, Strategy: ${player1Setup.strategy || 'Default'}`,
            timestamp: Date.now(),
            activePlayer: 'player1',
            resolved: true
        },
        {
            id: generateId(),
            type: 'spell_cast',
            description: `P2 Element: ${player2Setup.element}, Strategy: ${player2Setup.strategy || 'Default'}`,
            timestamp: Date.now(),
            activePlayer: 'player2',
            resolved: true
        },
        {
            id: generateId(),
            type: 'spell_cast',
            description: 'Turn 1 - Player 1 (Initial state)',
            timestamp: Date.now(),
            activePlayer: 'player1',
            resolved: false
        }
    ];

    initialGameState.storyline = initialEvents;

    logToStderr('TypeScript: Mock game state created.');

    return initialGameState;
}

// Main execution block when script is run directly
if (require.main === module) {
    (async () => {
        try {
            const p1SetupArg = process.argv[2];
            const p2SetupArg = process.argv[3];

            if (!p1SetupArg || !p2SetupArg) {
                process.stderr.write('Usage: node initialize-simulation.ts <player1SetupJson> <player2SetupJson>\n');
                process.exit(1);
            }

            const player1Setup: PlayerSetup = JSON.parse(p1SetupArg);
            const player2Setup: PlayerSetup = JSON.parse(p2SetupArg);

            const gameState = await initializeNewSimulation(player1Setup, player2Setup);
            
            // Output ONLY JSON to stdout - no other text
            process.stdout.write(JSON.stringify(gameState, null, 2));
        } catch (error) {
            process.stderr.write('Error during simulation initialization: ' + (error instanceof Error ? error.message : String(error)) + '\n');
            process.exit(1);
        }
    })();
}
