// Express server to interface with the TypeScript deck builder
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));

// Serve simulation specific static files if requested directly
app.use('/simulation', express.static(path.join(__dirname, 'web', 'simulation')));

// Route to serve the web interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'index.html'));
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

        // Path to the TypeScript deck builder
        const scriptPath = path.join(__dirname, 'src', 'main', 'build-deck.ts');
        
        // Execute the deck builder
        const deckBuilderProcess = spawn('node', ['-r', 'ts-node/register', scriptPath, ...args], {
            cwd: __dirname,
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
                    const exportsDir = path.join(__dirname, 'exports');
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

// API endpoint to initialize a simulation
app.post('/api/initialize-simulation', async (req, res) => {
    try {
        const { player1Setup, player2Setup } = req.body;

        // TODO: Implement the logic to call your TypeScript simulation initialization script
        // This script would:
        // 1. Take player1Setup and player2Setup (avatar, strategy, element) as input.
        // 2. Use deckBuilder.ts to create decks for P1 and P2.
        // 3. Initialize a GameState from simulationIntegration.ts or testFramework.ts.
        // 4. Return the initial GameState JSON.

        console.log('Initializing simulation with setups:', player1Setup, player2Setup);

        // Path to a new or existing TypeScript script that handles simulation initialization
        // For now, let's assume a script named 'initialize-simulation.ts' in 'src/main/'
        const scriptPath = path.join(__dirname, 'src', 'main', 'initialize-simulation.ts');

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

        const simulationProcess = spawn('node', ['-r', 'ts-node/register', scriptPath, ...args], {
            cwd: __dirname,
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
                console.error('Simulation initialization failed with code:', code);
                console.error('Error output:', errorOutput);
                return res.status(500).json({
                    error: `Simulation initialization failed: ${errorOutput || 'Unknown error'}`
                });
            }

            try {
                const gameState = JSON.parse(output);
                res.json({ success: true, gameState });
            } catch (parseError) {
                console.error('Failed to parse simulation output:', parseError);
                console.error('Raw output was:', output);
                res.status(500).json({
                    error: 'Failed to parse simulation output.',
                    rawOutput: output
                });
            }
        });

        simulationProcess.on('error', (error) => {
            console.error('Failed to start simulation process:', error);
            res.status(500).json({
                error: `Failed to start simulation process: ${error.message}`
            });
        });

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
    console.log(`📁 Serving web interface from: ${path.join(__dirname, 'web')}`);
    console.log(`⚙️  Deck builder script: ${path.join(__dirname, 'src', 'main', 'build-deck.ts')}`);
});

module.exports = app;
