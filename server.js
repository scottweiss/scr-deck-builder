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
