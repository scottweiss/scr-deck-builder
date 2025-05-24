// Express server to interface with the TypeScript deck builder
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'web')));

// Serve compiled JavaScript files from dist directory
app.use('/dist', express.static(path.join(__dirname, '..', 'dist')));

// Serve simulation specific static files if requested directly
app.use('/simulation', express.static(path.join(__dirname, '..', 'web', 'simulation')));

// API endpoint to list all available avatars
app.get('/api/list-avatars', async (req, res) => {
    try {
        // Import card data system from compiled JavaScript
        const { getAllCards } = require('../dist/data/processed/sorceryCards');
        
        // Get all cards and filter for avatars
        const allCards = await getAllCards();
        console.log(`Total cards loaded: ${allCards.length}`);
        
        // Debug card types
        const types = {};
        allCards.forEach(card => {
            const type = card.type || 'Unknown';
            types[type] = (types[type] || 0) + 1;
        });
        console.log('Card types in database:', types);
        
        // Try different approaches to filter avatars
        const avatarsByType = allCards.filter(card => card.type === 'Avatar');
        const avatarsByExtType = allCards.filter(card => card.extCardType === 'Avatar');
        const avatarsByNameMatch = allCards.filter(card => 
            (card.name && card.name.toLowerCase().includes('avatar')) || 
            (card.cleanName && card.cleanName.toLowerCase().includes('avatar'))
        );
        
        console.log(`Avatars by type: ${avatarsByType.length}`);
        console.log(`Avatars by extCardType: ${avatarsByExtType.length}`);
        console.log(`Avatars by name match: ${avatarsByNameMatch.length}`);
        
        // Use the most effective approach
        const avatars = avatarsByExtType.length > 0 ? avatarsByExtType : 
                        avatarsByType.length > 0 ? avatarsByType : 
                        avatarsByNameMatch;
        
        if (avatars.length > 0) {
            console.log('First avatar details:', JSON.stringify(avatars[0], null, 2));
            
            // Log available fields for debugging
            const fields = Object.keys(avatars[0]);
            console.log('Available fields on avatar objects:', fields.join(', '));
        }
        
        // Associate avatars with elements based on their name and description
        const elementMapping = {
            'Waveshaper': 'Water',
            'Battlemage': 'Fire',
            'Seer': 'Void',
            'Deathspeaker': 'Void',
            'Elementalist': 'Earth',
            'Enchantress': 'Air',
            'Sorcerer': 'Air',
            'Sparkmage': 'Air',
            'Geomancer': 'Earth',
            'Flamecaller': 'Fire', 
            'Pathfinder': 'Earth',
            'Spellslinger': 'Fire',
            'Archimago': 'Void',
            'Druid': 'Earth',
            'Templar': 'Air',
            'Witch': 'Void'
        };
        
        // Transform avatars into the format expected by the frontend
        const processedAvatars = avatars.map(avatar => {
            // Extract life value from text content if not specified directly
            let life = avatar.extLife ? parseInt(avatar.extLife) : 0;
            if (life === 0 && avatar.extDescription) {
                const lifeMatch = avatar.extDescription.match(/(\d+) Life/i);
                if (lifeMatch) {
                    life = parseInt(lifeMatch[1]);
                }
            }
            
            // Determine element from extElement field or element mapping
            const elements = [];
            if (avatar.extElement) {
                elements.push(avatar.extElement);
            } else if (elementMapping[avatar.name]) {
                elements.push(elementMapping[avatar.name]);
            }
            
            return {
                name: avatar.name || 'Unknown Avatar',
                life: life || 20, // Default to 20 life if not specified
                elements: elements,
                text: avatar.extDescription || ''
            };
        });

        console.log(`Processed ${processedAvatars.length} avatars for frontend`);
        res.json(processedAvatars);
    } catch (error) {
        console.error('Failed to load avatars:', error);
        res.status(500).json({
            error: 'Failed to load avatar data'
        });
    }
});

// Route to serve the web interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'web', 'index.html'));
});

// API endpoint to build deck
app.post('/api/build-deck', async (req, res) => {
    try {
        const { element, archetype, cardSet, exportJson, showRules } = req.body;
        
        // Build command line arguments for the deck builder
        const args = [];
        
        if (element && element !== '') {
            args.push('--element', element);
        }
        
        if (archetype && archetype !== '') {
            args.push('--archetype', archetype);
        }
        
        if (cardSet && cardSet !== '') {
            args.push('--set', cardSet);
        }
        
        if (exportJson) {
            args.push('--export-json');
        }
        
        if (showRules) {
            args.push('--show-rules');
        }

        console.log('Building deck with args:', args);

        // Path to the compiled JavaScript deck builder
        const scriptPath = path.join(__dirname, '..', 'dist', 'main', 'build-deck.js');
        
        // Execute the deck builder
        const deckBuilderProcess = spawn('node', [scriptPath, ...args], {
            cwd: path.join(__dirname, '..'),
            env: { ...process.env }
        });

        let output = '';
        let errorOutput = '';

        // Collect stdout
        deckBuilderProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        // Collect stderr
        deckBuilderProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        // Handle process completion
        deckBuilderProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Deck builder failed with code:', code);
                console.error('Error output:', errorOutput);
                return res.status(500).json({
                    error: `Deck builder failed: ${errorOutput || 'Unknown error'}`
                });
            }

            // Process the output to extract useful information
            const deckReport = output;
            let deckJson = null;
            let jsonExported = false;

            // Check if JSON was exported and try to read it
            if (exportJson) {
                try {
                    // Look for the most recent JSON file in the exports directory
                    const exportsDir = path.join(__dirname, '..', 'exports');
                    if (fs.existsSync(exportsDir)) {
                        const files = fs.readdirSync(exportsDir)
                            .filter(file => file.endsWith('.json'))
                            .map(file => ({
                                name: file,
                                time: fs.statSync(path.join(exportsDir, file)).mtime.getTime()
                            }))
                            .sort((a, b) => b.time - a.time);

                        if (files.length > 0) {
                            const latestFile = path.join(exportsDir, files[0].name);
                            deckJson = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
                            jsonExported = true;
                        }
                    }
                } catch (error) {
                    console.warn('Failed to read exported JSON:', error.message);
                }
            }

            res.json({
                success: true,
                deckReport,
                deckJson,
                jsonExported
            });
        });

        // Handle process errors
        deckBuilderProcess.on('error', (error) => {
            console.error('Failed to start deck builder:', error);
            res.status(500).json({
                error: `Failed to start deck builder: ${error.message}`
            });
        });

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            error: `Server error: ${error.message}`
        });
    }
});

// Function to generate a more realistic mock game state
function createEnhancedMockGameState(player1Setup, player2Setup) {
    const gameLength = Math.floor(Math.random() * 10) + 5; // 5-15 turns
    const winner = Math.random() > 0.5 ? 'player1' : (Math.random() > 0.5 ? 'player2' : null);
    
    // Generate a more interesting storyline
    const storyline = [
        `Game started: ${player1Setup.avatar} (${player1Setup.element}) vs ${player2Setup.avatar} (${player2Setup.element})`,
        `${player1Setup.avatar} employs a ${player1Setup.strategy || 'balanced'} strategy with ${player1Setup.element} magic`,
        `${player2Setup.avatar} counters with a ${player2Setup.strategy || 'balanced'} approach using ${player2Setup.element} magic`,
        `Turn ${Math.ceil(gameLength/2)}: The battle intensifies as both avatars unleash their elemental powers`,
        winner ? `Turn ${gameLength}: ${winner === 'player1' ? player1Setup.avatar : player2Setup.avatar} emerges victorious!` : 
                `Turn ${gameLength}: Both avatars continue their epic duel...`
    ];

    return {
        turn: gameLength,
        phase: winner ? 'Game Over' : 'Main Phase',
        activePlayer: winner === 'player1' ? 'Player 1' : 'Player 2',
        winner,
        players: {
            'Player 1': {
                id: 'Player 1',
                life: winner === 'player1' ? Math.floor(Math.random() * 15) + 5 : 
                      winner === 'player2' ? 0 : Math.floor(Math.random() * 10) + 10,
                mana: Math.min(gameLength, 10),
                avatar: player1Setup.avatar,
                avatarName: player1Setup.avatar,
                deckStats: {
                    spells: player1Setup.strategy === 'Aggro' ? 35 : 
                           player1Setup.strategy === 'Control' ? 40 : 37,
                    sites: player1Setup.strategy === 'Aggro' ? 15 : 
                           player1Setup.strategy === 'Control' ? 20 : 17
                },
                hand: []
            },
            'Player 2': {
                id: 'Player 2',
                life: winner === 'player2' ? Math.floor(Math.random() * 15) + 5 : 
                      winner === 'player1' ? 0 : Math.floor(Math.random() * 10) + 10,
                mana: Math.min(gameLength, 10),
                avatar: player2Setup.avatar,
                avatarName: player2Setup.avatar,
                deckStats: {
                    spells: player2Setup.strategy === 'Aggro' ? 35 : 
                           player2Setup.strategy === 'Control' ? 40 : 37,
                    sites: player2Setup.strategy === 'Aggro' ? 15 : 
                           player2Setup.strategy === 'Control' ? 20 : 17
                },
                hand: []
            }
        },
        grid: Array(5).fill(null).map(() => Array(4).fill(null)),
        storyline,
        gameOver: !!winner,
        firstPlayer: 'Player 1'
    };
}

// API endpoint to initialize a simulation
app.post('/api/initialize-simulation', async (req, res) => {
    try {
        const { player1Setup, player2Setup } = req.body;

        console.log('Initializing simulation with:', { player1Setup, player2Setup });

        console.log('Initializing simulation with setups:', player1Setup, player2Setup);

        // Path to a new or existing TypeScript script that handles simulation initialization
        // For now, let's assume a script named 'initialize-simulation.ts' in 'src/main/'
        const scriptPath = path.join(__dirname, '..', 'src', 'main', 'initialize-simulation.ts');

        // Check if the script exists, if not, we'll need to create it.
        if (!fs.existsSync(scriptPath)) {
            console.warn(`Simulation script not found at ${scriptPath}. Please create it.`);
            // For now, return a mock response
            return res.status(501).json({
                message: "Simulation initialization script not found. Returning mock data.",
                mockGameState: {
                    turn: 1,
                    phase: 'Start of Game (Mock)',
                    activePlayer: 'Player 1',
                    players: {
                        'Player 1': { id: 'Player 1', life: 20, mana: 1, avatarName: player1Setup.avatar, deckStats: { spells: 20, sites: 10 }, hand: [{name: 'Mock Card'}] },
                        'Player 2': { id: 'Player 2', life: 20, mana: 1, avatarName: player2Setup.avatar, deckStats: { spells: 20, sites: 10 }, hand: [{name: 'Mock Card'}] }
                    },
                    grid: Array(5).fill(null).map(() => Array(4).fill(null)),
                    storyline: [`Mock game started with P1: ${player1Setup.avatar} and P2: ${player2Setup.avatar}`],
                    gameOver: false,
                    firstPlayer: 'Player 1'
                }
            });
        }

        const args = [
            JSON.stringify(player1Setup),
            JSON.stringify(player2Setup)
        ];

        // Try compiled JavaScript first, then fall back to TypeScript
        const compiledScriptPath = path.join(__dirname, '..', 'dist', 'main', 'initialize-simulation.js');
        
        if (fs.existsSync(compiledScriptPath)) {
            console.log('Using compiled simulation script');
            const simulationProcess = spawn('node', [compiledScriptPath, ...args], {
                cwd: path.join(__dirname, '..'),
                env: { ...process.env }
            });

            let output = '';
            let errorOutput = '';

            simulationProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            simulationProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            simulationProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Compiled simulation failed, falling back to enhanced mock');
                    return res.json({
                        success: true,
                        gameState: createEnhancedMockGameState(player1Setup, player2Setup),
                        source: 'fallback-compiled-error'
                    });
                }

                try {
                    const gameState = JSON.parse(output);
                    res.json({ success: true, gameState, source: 'compiled' });
                } catch (parseError) {
                    console.error('Failed to parse compiled output, using enhanced mock');
                    res.json({
                        success: true,
                        gameState: createEnhancedMockGameState(player1Setup, player2Setup),
                        source: 'fallback-parse-error'
                    });
                }
            });

            simulationProcess.on('error', (error) => {
                console.error('Compiled simulation process error, using enhanced mock');
                res.json({
                    success: true,
                    gameState: createEnhancedMockGameState(player1Setup, player2Setup),
                    source: 'fallback-process-error'
                });
            });
        } else {
            // Fall back to TypeScript execution
            console.log('Compiled script not found, trying TypeScript');
            const simulationProcess = spawn('node', ['-r', 'ts-node/register', scriptPath, ...args], {
                cwd: path.join(__dirname, '..'),
                env: { ...process.env }
            });

            let output = '';
            let errorOutput = '';

            simulationProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            simulationProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            simulationProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('TypeScript simulation failed, using enhanced mock');
                    return res.json({
                        success: true,
                        gameState: createEnhancedMockGameState(player1Setup, player2Setup),
                        source: 'fallback-typescript-error'
                    });
                }

                try {
                    const gameState = JSON.parse(output);
                    res.json({ success: true, gameState, source: 'typescript' });
                } catch (parseError) {
                    console.error('Failed to parse TypeScript output, using enhanced mock');
                    res.json({
                        success: true,
                        gameState: createEnhancedMockGameState(player1Setup, player2Setup),
                        source: 'fallback-typescript-parse'
                    });
                }
            });

            simulationProcess.on('error', (error) => {
                console.error('TypeScript simulation process error, using enhanced mock');
                res.json({
                    success: true,
                    gameState: createEnhancedMockGameState(player1Setup, player2Setup),
                    source: 'fallback-typescript-process'
                });
            });
        }

    } catch (error) {
        console.error('API /api/initialize-simulation error:', error);
        res.status(500).json({
            error: `Server error: ${error.message}`
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎯 Sorcery: Contested Realm Deck Builder Server`);
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📁 Serving web interface from: ${path.join(__dirname, '..', 'web')}`);
    console.log(`⚙️  Deck builder script: ${path.join(__dirname, '..', 'src', 'main', 'build-deck.ts')}`);
});

module.exports = app;
