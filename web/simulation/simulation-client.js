// Sorcery: Contested Realm - Client-side Simulation Interface
// This script provides direct access to the compiled JavaScript APIs

// We'll load the compiled modules dynamically
let deckBuilder, deckValidator, simulationIntegration, matchSimulator, aiEngine, utils;

async function loadModules() {
    try {
        // Load compiled modules from the dist directory
        const modules = await Promise.all([
            import('../../dist/core/deck/deckBuilder.js'),
            import('../../dist/core/deck/deckValidator.js'), 
            import('../../dist/core/simulation/simulationIntegration.js'),
            import('../../dist/core/simulation/matchSimulator.js'),
            import('../../dist/core/simulation/aiEngine.js'),
            import('../../dist/utils/utils.js')
        ]);
        
        [deckBuilder, deckValidator, simulationIntegration, matchSimulator, aiEngine, utils] = modules;
        return true;
    } catch (error) {
        console.error('Failed to load modules:', error);
        return false;
    }
}

class SorcerySimulationClient {
    constructor() {
        this.cardData = null;
        this.simulator = null;
        this.validator = null;
        this.isInitialized = false;
        this.modulesLoaded = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        // Load modules first
        if (!this.modulesLoaded) {
            const loaded = await loadModules();
            if (!loaded) {
                throw new Error('Failed to load required modules');
            }
            this.modulesLoaded = true;
        }
        
        console.log('Loading card data...');
        try {
            // Initialize components
            this.simulator = new simulationIntegration.SimulationIntegration();
            this.validator = new deckValidator.DeckValidator();
            
            // Load card data from the processed data files
            this.cardData = await utils.readCardData(['Beta', 'ArthurianLegends']);
            this.isInitialized = true;
            console.log(`Loaded ${this.cardData.length} cards`);
        } catch (error) {
            console.error('Failed to load card data:', error);
            throw new Error('Failed to initialize card data');
        }
    }

    async buildDeck(options) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const {
            avatar,
            element,
            strategy,
            archetypePreference,
            cardSet = ['Beta', 'ArthurianLegends']
        } = options;

        // Filter cards by element and type
        const filteredCards = this.cardData.filter(card => {
            // Include cards that match the preferred element or are neutral
            const cardElements = card.elements || [];
            return cardElements.length === 0 || cardElements.includes(element);
        });

        // Separate cards by type
        const minions = filteredCards.filter(card => card.type === 'Minion');
        const artifacts = filteredCards.filter(card => card.type === 'Artifact');
        const auras = filteredCards.filter(card => card.type === 'Aura');
        const magics = filteredCards.filter(card => card.type === 'Magic');
        const sites = filteredCards.filter(card => card.type === 'Site');
        const avatars = filteredCards.filter(card => card.type === 'Avatar');

        // Find the selected avatar
        const selectedAvatar = avatars.find(card => 
            card.name.toLowerCase().includes(avatar.toLowerCase())
        ) || avatars[0]; // fallback to first avatar

        // Build deck using the deck builder
        const deckOptions = {
            minions,
            artifacts,
            auras,
            magics,
            sites,
            avatar: selectedAvatar,
            preferredElement: element,
            preferredArchetype: strategy || archetypePreference,
            maxCards: 60,
            enforceRules: true
        };

        const deck = deckBuilder.buildCompleteDeck(deckOptions);
        
        // Validate the deck
        const validation = this.validator.validateDeck(deck);
        if (!validation.isValid) {
            console.warn('Deck validation warnings:', validation.warnings);
        }

        return deck;
    }

    async simulateMatch(player1Setup, player2Setup, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const {
            enableLogging = true,
            maxTurns = 50,
            iterations = 1
        } = options;

        // Build decks for both players
        const player1Deck = await this.buildDeck(player1Setup);
        const player2Deck = await this.buildDeck(player2Setup);

        // Convert strategy names to AI strategies
        const player1Strategy = this.getAIStrategy(player1Setup.strategy);
        const player2Strategy = this.getAIStrategy(player2Setup.strategy);

        // Run simulation
        const result = await this.simulator.simulateMatch(
            player1Deck.spellbook.concat(player1Deck.sites),
            player2Deck.spellbook.concat(player2Deck.sites),
            player1Strategy,
            player2Strategy,
            { enableLogging, maxTurns }
        );

        // Add deck information to the result
        result.player1Deck = player1Deck;
        result.player2Deck = player2Deck;
        result.player1Setup = player1Setup;
        result.player2Setup = player2Setup;

        return result;
    }

    async batchSimulate(player1Setup, player2Setup, iterations = 10) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Build decks once
        const player1Deck = await this.buildDeck(player1Setup);
        const player2Deck = await this.buildDeck(player2Setup);

        // Convert strategy names to AI strategies
        const player1Strategy = this.getAIStrategy(player1Setup.strategy);
        const player2Strategy = this.getAIStrategy(player2Setup.strategy);

        // Run batch simulation
        const batchResult = await this.simulator.batchSimulate(
            player1Deck.spellbook.concat(player1Deck.sites),
            player2Deck.spellbook.concat(player2Deck.sites),
            iterations,
            player1Strategy,
            player2Strategy
        );

        // Add deck information to the result
        batchResult.player1Deck = player1Deck;
        batchResult.player2Deck = player2Deck;
        batchResult.player1Setup = player1Setup;
        batchResult.player2Setup = player2Setup;

        return batchResult;
    }

    getAIStrategy(strategyName) {
        const strategies = {
            'Aggro': aiEngine.AI_STRATEGIES.AGGRO,
            'Control': aiEngine.AI_STRATEGIES.CONTROL,
            'Midrange': aiEngine.AI_STRATEGIES.MIDRANGE,
            'Balanced': aiEngine.AI_STRATEGIES.MIDRANGE, // fallback
            '': aiEngine.AI_STRATEGIES.MIDRANGE // default
        };

        return strategies[strategyName] || aiEngine.AI_STRATEGIES.MIDRANGE;
    }

    getAvailableAvatars() {
        if (!this.cardData) return [];
        return this.cardData.filter(card => card.type === 'Avatar').map(card => card.name);
    }

    getAvailableElements() {
        return ['Fire', 'Water', 'Earth', 'Air', 'Void'];
    }

    getAvailableStrategies() {
        return ['Aggro', 'Control', 'Midrange', 'Balanced'];
    }
}

// Create global instance
window.SorceryClient = new SorcerySimulationClient();

// DOM event handlers
document.addEventListener('DOMContentLoaded', async () => {
    const buildAndStartButton = document.getElementById('buildAndStartSimulation');
    const loadSampleButton = document.getElementById('loadSampleSimulation');
    const gameBoardElement = document.getElementById('gameBoard');
    const gameStateInfoElement = document.getElementById('gameStateInfo');
    const eventLogElement = document.getElementById('eventLog');

    // Initialize the client
    try {
        logEvent('Initializing Sorcery simulation client...', eventLogElement);
        await window.SorceryClient.initialize();
        logEvent('✅ Client initialized successfully!', eventLogElement);
        
        // Populate dropdowns with real data
        populateDropdowns();
    } catch (error) {
        logEvent(`❌ Failed to initialize client: ${error.message}`, eventLogElement);
        console.error('Initialization error:', error);
    }

    // DOM elements for player setup
    const p1AvatarSelect = document.getElementById('p1Avatar');
    const p1StrategySelect = document.getElementById('p1Strategy');
    const p1ElementSelect = document.getElementById('p1Element');
    const p2AvatarSelect = document.getElementById('p2Avatar');
    const p2StrategySelect = document.getElementById('p2Strategy');
    const p2ElementSelect = document.getElementById('p2Element');

    if (buildAndStartButton) {
        buildAndStartButton.addEventListener('click', async () => {
            logEvent('Gathering player selections...', eventLogElement);

            const player1Setup = {
                avatar: p1AvatarSelect.value,
                strategy: p1StrategySelect.value,
                element: p1ElementSelect.value
            };

            const player2Setup = {
                avatar: p2AvatarSelect.value,
                strategy: p2StrategySelect.value,
                element: p2ElementSelect.value
            };

            logEvent(`Player 1: ${player1Setup.avatar} (${player1Setup.element}, ${player1Setup.strategy || 'Default'} strategy)`, eventLogElement);
            logEvent(`Player 2: ${player2Setup.avatar} (${player2Setup.element}, ${player2Setup.strategy || 'Default'} strategy)`, eventLogElement);

            try {
                logEvent('Building decks and running simulation...', eventLogElement);
                
                // Run a single match simulation
                const result = await window.SorceryClient.simulateMatch(player1Setup, player2Setup);
                
                logEvent('✅ Simulation completed successfully!', eventLogElement);
                
                // Display results
                displaySimulationResult(result, gameBoardElement, gameStateInfoElement, eventLogElement);
                
                // Display deck information
                displayDeckLists(result, player1Setup, player2Setup);
                
            } catch (error) {
                console.error('Simulation failed:', error);
                logEvent(`❌ Simulation failed: ${error.message}`, eventLogElement);
            }
        });
    }

    if (loadSampleButton) {
        loadSampleButton.addEventListener('click', async () => {
            try {
                logEvent('Running sample batch simulation...', eventLogElement);
                
                const player1Setup = {
                    avatar: 'Avatar of Fire',
                    strategy: 'Aggro',
                    element: 'Fire'
                };

                const player2Setup = {
                    avatar: 'Avatar of Water',
                    strategy: 'Control',
                    element: 'Water'
                };

                const batchResult = await window.SorceryClient.batchSimulate(player1Setup, player2Setup, 5);
                
                logEvent('✅ Batch simulation completed!', eventLogElement);
                displayBatchResult(batchResult, gameBoardElement, gameStateInfoElement, eventLogElement);
                displayDeckLists(batchResult, player1Setup, player2Setup);
                
            } catch (error) {
                console.error('Sample simulation failed:', error);
                logEvent(`❌ Sample simulation failed: ${error.message}`, eventLogElement);
            }
        });
    }

    function populateDropdowns() {
        const avatars = window.SorceryClient.getAvailableAvatars();
        const elements = window.SorceryClient.getAvailableElements();
        const strategies = window.SorceryClient.getAvailableStrategies();

        // Populate avatar dropdowns
        if (avatars.length > 0) {
            populateSelect(p1AvatarSelect, avatars);
            populateSelect(p2AvatarSelect, avatars);
        }

        // Populate strategy dropdowns
        populateSelect(p1StrategySelect, ['', ...strategies]);
        populateSelect(p2StrategySelect, ['', ...strategies]);

        // Populate element dropdowns
        populateSelect(p1ElementSelect, elements, true);
        populateSelect(p2ElementSelect, elements, true);
    }

    function populateSelect(selectElement, options, addEmoji = false) {
        if (!selectElement) return;
        
        selectElement.innerHTML = '';
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option || '';
            
            if (addEmoji && option) {
                const emojis = {
                    'Fire': '🔥',
                    'Water': '💧',
                    'Earth': '🌍',
                    'Air': '💨',
                    'Void': '🌌'
                };
                optionElement.textContent = `${emojis[option] || ''} ${option}`;
            } else {
                optionElement.textContent = option || 'None';
            }
            
            selectElement.appendChild(optionElement);
        });
    }

    console.log('Sorcery simulation client loaded.');
});

function displaySimulationResult(result, gameBoardElement, gameStateInfoElement, eventLogElement) {
    if (!result) return;

    // Create a mock game state from the simulation result
    const gameState = createGameStateFromSimulation(result);
    
    // Display the game board
    renderGameBoard(gameState, gameBoardElement);
    updateGameStateInfo(gameState, gameStateInfoElement);
    
    // Display the game log
    if (result.gameLog && Array.isArray(result.gameLog)) {
        const storyline = result.gameLog.map(entry => 
            typeof entry === 'string' ? entry : 
            entry.description || entry.message || 'Game event'
        );
        displayStoryline(storyline, eventLogElement);
    }
}

function displayBatchResult(batchResult, gameBoardElement, gameStateInfoElement, eventLogElement) {
    if (!batchResult) return;

    // Display batch statistics
    const statsHtml = `
        <h3>Batch Simulation Results</h3>
        <div class="batch-stats">
            <p><strong>Total Games:</strong> ${batchResult.totalGames}</p>
            <p><strong>Player 1 Win Rate:</strong> ${(batchResult.player1WinRate * 100).toFixed(1)}%</p>
            <p><strong>Player 2 Win Rate:</strong> ${(batchResult.player2WinRate * 100).toFixed(1)}%</p>
            <p><strong>Average Game Length:</strong> ${batchResult.averageTurns.toFixed(1)} turns</p>
            <p><strong>Player 1 Wins:</strong> ${batchResult.player1Wins}</p>
            <p><strong>Player 2 Wins:</strong> ${batchResult.player2Wins}</p>
            <p><strong>Draws:</strong> ${batchResult.draws}</p>
        </div>
    `;

    gameStateInfoElement.innerHTML = statsHtml;
    
    // Show sample game from the batch
    if (batchResult.gameResults && batchResult.gameResults.length > 0) {
        const sampleGame = batchResult.gameResults[0];
        const gameState = createGameStateFromSimulation(sampleGame);
        renderGameBoard(gameState, gameBoardElement);
        
        logEvent(`Sample game: ${sampleGame.winner} won in ${sampleGame.turns} turns`, eventLogElement);
    }
}

function createGameStateFromSimulation(result) {
    // Create a basic game state structure from simulation result
    return {
        turn: result.turns || 1,
        phase: result.winner ? 'Game Over' : 'Main Phase',
        activePlayer: result.winner === 'player1' ? 'Player 1' : 'Player 2',
        winner: result.winner,
        players: {
            'Player 1': {
                id: 'Player 1',
                life: result.winner === 'player1' ? 20 : (result.winner === 'player2' ? 0 : 15),
                mana: Math.min(result.turns || 1, 10),
                avatar: result.player1Setup?.avatar || 'Avatar',
                avatarName: result.player1Setup?.avatar,
                deckStats: {
                    spells: result.player1Deck?.spellbook?.length || 0,
                    sites: result.player1Deck?.sites?.length || 0
                },
                hand: []
            },
            'Player 2': {
                id: 'Player 2', 
                life: result.winner === 'player2' ? 20 : (result.winner === 'player1' ? 0 : 15),
                mana: Math.min(result.turns || 1, 10),
                avatar: result.player2Setup?.avatar || 'Avatar',
                avatarName: result.player2Setup?.avatar,
                deckStats: {
                    spells: result.player2Deck?.spellbook?.length || 0,
                    sites: result.player2Deck?.sites?.length || 0
                },
                hand: []
            }
        },
        // Create a simple 5x4 grid with some sample pieces
        grid: createSampleGrid(result),
        storyline: []
    };
}

function createSampleGrid(result) {
    // Create a 5x4 grid with some sample game pieces
    const grid = Array(5).fill(null).map(() => Array(4).fill(null));
    
    // Add some sample pieces based on simulation result
    if (result.turns > 1) {
        grid[0][1] = {
            id: 'piece1',
            name: `${result.player1Setup?.element || 'Fire'} Minion`,
            owner: 'Player 1',
            type: 'unit'
        };
        
        grid[1][2] = {
            id: 'piece2',
            name: `${result.player2Setup?.element || 'Water'} Minion`,
            owner: 'Player 2',
            type: 'unit'
        };
    }
    
    if (result.turns > 3) {
        grid[0][3] = {
            id: 'site1',
            name: `${result.player1Setup?.element || 'Fire'} Site`,
            owner: 'Player 1',
            type: 'site'
        };
    }
    
    return grid;
}

// Include the existing display functions
function renderGameBoard(gameState, gameBoardElement) {
    if (!gameBoardElement) return;

    gameBoardElement.innerHTML = '';
    const gridData = gameState.grid;

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';
    gridContainer.style.gridTemplateRows = `repeat(${gridData.length}, 1fr)`;

    gridData.forEach((row, rowIndex) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'grid-row';
        rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;

        row.forEach((cellData, colIndex) => {
            const cellElement = document.createElement('div');
            cellElement.className = 'grid-cell';
            cellElement.dataset.row = rowIndex;
            cellElement.dataset.col = colIndex;

            if (cellData) {
                cellElement.classList.add(cellData.type === 'unit' ? 'unit' : 'site');
                cellElement.classList.add(cellData.owner === 'Player 1' ? 'player1-piece' : 'player2-piece');
                
                const nameElement = document.createElement('div');
                nameElement.className = 'piece-name';
                nameElement.textContent = cellData.name;
                cellElement.appendChild(nameElement);

                const ownerElement = document.createElement('div');
                ownerElement.className = 'piece-owner';
                ownerElement.textContent = cellData.owner;
                cellElement.appendChild(ownerElement);
            } else {
                cellElement.classList.add('empty-cell');
            }
            rowElement.appendChild(cellElement);
        });
        gridContainer.appendChild(rowElement);
    });
    gameBoardElement.appendChild(gridContainer);
}

function updateGameStateInfo(gameState, gameStateInfoElement) {
    if (!gameStateInfoElement) return;
    
    const player1 = gameState.players['Player 1'];
    const player2 = gameState.players['Player 2'];

    gameStateInfoElement.innerHTML = `
        <h3>Game State</h3>
        <p><strong>Turn:</strong> ${gameState.turn}</p>
        <p><strong>Phase:</strong> ${gameState.phase}</p>
        <p><strong>Active Player:</strong> ${gameState.activePlayer}</p>
        ${gameState.winner ? `<p><strong>Winner:</strong> ${gameState.winner === 'player1' ? 'Player 1' : 'Player 2'}</p>` : ''}
        <h4>Players</h4>
        <div class="player-info">
            <div><strong>${player1.id} (${player1.avatarName || 'Avatar'})</strong></div>
            <div>Life: ${player1.life}, Mana: ${player1.mana}</div>
            <div>Deck: ${player1.deckStats?.spells || 'N/A'} spells, ${player1.deckStats?.sites || 'N/A'} sites</div>
        </div>
        <div class="player-info">
            <div><strong>${player2.id} (${player2.avatarName || 'Avatar'})</strong></div>
            <div>Life: ${player2.life}, Mana: ${player2.mana}</div>
            <div>Deck: ${player2.deckStats?.spells || 'N/A'} spells, ${player2.deckStats?.sites || 'N/A'} sites</div>
        </div>
    `;
}

function displayStoryline(storyline, eventLogElement) {
    if (!eventLogElement) return;
    
    storyline.forEach(eventText => {
        const p = document.createElement('p');
        p.textContent = eventText;
        eventLogElement.appendChild(p);
    });
    eventLogElement.scrollTop = eventLogElement.scrollHeight;
}

function logEvent(message, eventLogElement) {
    if (!eventLogElement) {
        eventLogElement = document.getElementById('eventLog');
    }
    if (!eventLogElement) return;

    const p = document.createElement('p');
    p.className = 'system-message';
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    if (!eventLogElement.querySelector('h3')) {
        const title = document.createElement('h3');
        title.textContent = "Event Log";
        eventLogElement.prepend(title);
    }

    eventLogElement.appendChild(p);
    eventLogElement.scrollTop = eventLogElement.scrollHeight;
}

function displayDeckLists(result, player1Setup, player2Setup) {
    // Create or get deck display container
    let deckContainer = document.getElementById('deckLists');
    if (!deckContainer) {
        deckContainer = document.createElement('div');
        deckContainer.id = 'deckLists';
        deckContainer.className = 'deck-lists-container';
        
        const gameStateInfo = document.getElementById('gameStateInfo');
        if (gameStateInfo && gameStateInfo.parentNode) {
            gameStateInfo.parentNode.insertBefore(deckContainer, gameStateInfo.nextSibling);
        }
    }

    const player1Deck = result.player1Deck || { spellbook: [], sites: [] };
    const player2Deck = result.player2Deck || { spellbook: [], sites: [] };

    deckContainer.innerHTML = `
        <h3>Deck Lists</h3>
        <div class="deck-lists">
            <div class="deck-column">
                <h4>Player 1: ${player1Setup.avatar}</h4>
                <div class="deck-stats">
                    <p>Element: ${player1Setup.element}</p>
                    <p>Strategy: ${player1Setup.strategy || 'Default'}</p>
                    <p>Total Cards: ${player1Deck.spellbook.length + player1Deck.sites.length}</p>
                </div>
                <div class="deck-list">
                    ${renderDeckList([...player1Deck.spellbook, ...player1Deck.sites])}
                </div>
            </div>
            <div class="deck-column">
                <h4>Player 2: ${player2Setup.avatar}</h4>
                <div class="deck-stats">
                    <p>Element: ${player2Setup.element}</p>
                    <p>Strategy: ${player2Setup.strategy || 'Default'}</p>
                    <p>Total Cards: ${player2Deck.spellbook.length + player2Deck.sites.length}</p>
                </div>
                <div class="deck-list">
                    ${renderDeckList([...player2Deck.spellbook, ...player2Deck.sites])}
                </div>
            </div>
        </div>
    `;
}

function renderDeckList(deck) {
    if (!deck || deck.length === 0) {
        return '<p class="no-cards">No cards available</p>';
    }

    // Group cards by type
    const groupedCards = deck.reduce((groups, card) => {
        const type = card.type || 'Unknown';
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(card);
        return groups;
    }, {});

    let html = '';
    
    const typeOrder = ['Site', 'Minion', 'Magic', 'Artifact', 'Aura', 'Unknown'];
    const sortedTypes = Object.keys(groupedCards).sort((a, b) => {
        const aIndex = typeOrder.indexOf(a);
        const bIndex = typeOrder.indexOf(b);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    sortedTypes.forEach(type => {
        const cards = groupedCards[type];
        html += `<div class="card-type-group">`;
        html += `<h5 class="card-type-header">${type}s (${cards.length})</h5>`;
        html += `<div class="card-list">`;
        
        cards.forEach(card => {
            const cardName = card.name || 'Unknown Card';
            const cardCost = card.mana_cost !== undefined ? card.mana_cost : 
                           card.cost !== undefined ? card.cost : '?';
            const cardElements = card.elements ? card.elements.join(', ') : '';
            
            html += `<div class="deck-card">`;
            html += `<span class="card-cost">${cardCost}</span>`;
            html += `<span class="card-name">${cardName}</span>`;
            if (cardElements) {
                html += `<span class="card-element">${cardElements}</span>`;
            }
            html += `</div>`;
        });
        
        html += `</div>`;
        html += `</div>`;
    });
    
    return html;
}
