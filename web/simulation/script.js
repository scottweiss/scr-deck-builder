// Basic script for simulation viewer
document.addEventListener('DOMContentLoaded', () => {
    const buildAndStartButton = document.getElementById('buildAndStartSimulation');
    const loadSampleButton = document.getElementById('loadSampleSimulation');
    const gameBoardElement = document.getElementById('gameBoard');
    const gameStateInfoElement = document.getElementById('gameStateInfo');
    const eventLogElement = document.getElementById('eventLog');

    // DOM elements for player setup
    const p1AvatarSelect = document.getElementById('p1Avatar');
    const p1StrategySelect = document.getElementById('p1Strategy');
    const p1ElementSelect = document.getElementById('p1Element');
    const p2AvatarSelect = document.getElementById('p2Avatar');
    const p2StrategySelect = document.getElementById('p2Strategy');
    const p2ElementSelect = document.getElementById('p2Element');

    // --- Helper function to generate a mock card --- (can be removed if backend handles all card details)
    function createMockCard(name, type = 'Spell', cost = 1, owner = 'Player', element = 'Neutral') {
        return {
            id: name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            type: type, // 'Spell', 'Site', 'Unit' (for avatar)
            cost: cost,
            text: `A mock ${type} card.`,
            owner: owner,
            element: element,
            // Add other relevant card properties if needed for display or logic
        };
    }

    // --- Helper function to "build" a mock deck based on selections --- (This will be replaced by API call)
    // function generateMockDeck(avatarName, strategy, elementPreference, playerName) { ... }

    // Function to create an initial game state with built decks (This will be replaced by API call result)
    // function createGameStateWithDecks(deckP1, deckP2) { ... }

    // (Keep the old createInitialGameState for reference or remove if no longer needed by loadSampleSimulation)
    // function createInitialGameState() { ... }

    // Sample data to simulate a game state and event log (for "Load Sample" button)
    const sampleGameState = {
        turn: 3,
        phase: 'Combat Phase',
        activePlayer: 'Player 1',
        players: {
            'Player 1': { id: 'Player 1', life: 15, mana: 7, avatar: 'Avatar of Fire' },
            'Player 2': { id: 'Player 2', life: 12, mana: 5, avatar: 'Avatar of Water' }
        },
        // Grid: 5 rows, 4 columns. (row, col)
        // Units are simple objects for now
        grid: [
            [null, { id: 'u1', name: 'Fire Elemental', owner: 'Player 1', type: 'unit' }, null, { id: 's1', name: 'Volcano', owner: 'Player 1', type: 'site' }],
            [{ id: 'u2', name: 'Water Sprite', owner: 'Player 2', type: 'unit' }, null, null, null],
            [null, null, { id: 'u3', name: 'Earth Golem', owner: 'Player 1', type: 'unit' }, null],
            [null, { id: 's2', name: 'Mystic Spring', owner: 'Player 2', type: 'site' }, null, { id: 'u4', name: 'Air Spirit', owner: 'Player 2', type: 'unit' }],
            [null, null, null, null]
        ],
        storyline: [
            'Turn 1: Player 1 started the game.',
            'Player 1 summoned Fire Elemental at (0,1).',
            'Player 2 summoned Water Sprite at (1,0).',
            'Turn 2: Player 1 placed Volcano site at (0,3).',
            'Player 2 attacked Fire Elemental with Water Sprite.',
            'Turn 3: Player 1 summoned Earth Golem at (2,2).'
        ]
    };

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

            logEvent(`Player 1: ${player1Setup.avatar} (${player1Setup.element}, ${player1Setup.strategy || 'No specific'} strategy)`, eventLogElement);
            logEvent(`Player 2: ${player2Setup.avatar} (${player2Setup.element}, ${player2Setup.strategy || 'No specific'} strategy)`, eventLogElement);

            logEvent('Requesting simulation initialization from server...', eventLogElement);

            try {
                const response = await fetch('/api/initialize-simulation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        player1Setup,
                        player2Setup
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success && data.gameState) {
                    logEvent('✅ Simulation initialized successfully!', eventLogElement);
                    
                    // Display the game state
                    renderGameBoard(data.gameState, gameBoardElement);
                    updateGameStateInfo(data.gameState, gameStateInfoElement);
                    
                    // Display deck information
                    displayDeckLists(data.gameState, player1Setup, player2Setup);
                    
                    // Display storyline if available
                    if (data.gameState.storyline && Array.isArray(data.gameState.storyline)) {
                        const storylineText = data.gameState.storyline.map(event => 
                            typeof event === 'string' ? event : event.description || 'Game event'
                        );
                        displayStoryline(storylineText, eventLogElement);
                    }
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error) {
                console.error('Simulation initialization failed:', error);
                logEvent(`❌ Failed to initialize simulation: ${error.message}`, eventLogElement);
                
                // Show mock data as fallback
                logEvent('🔄 Loading mock simulation data...', eventLogElement);
                const mockGameState = createMockGameState();
                renderGameBoard(mockGameState, gameBoardElement);
                updateGameStateInfo(mockGameState, gameStateInfoElement);
                displayDeckLists(mockGameState, player1Setup, player2Setup);
                displayStoryline(['Mock simulation loaded due to server error'], eventLogElement);
            }
        });
    }

    if (loadSampleButton) { // Renamed from loadButton
        loadSampleButton.addEventListener('click', () => {
            renderGameBoard(sampleGameState, gameBoardElement);
            updateGameStateInfo(sampleGameState, gameStateInfoElement);
            displayStoryline(sampleGameState.storyline, eventLogElement);
            logEvent('Sample simulation data loaded and displayed.', eventLogElement);
        });
    }

    console.log('Simulation viewer script loaded.');
});

function renderGameBoard(gameState, gameBoardElement) {
    if (!gameBoardElement) return;

    gameBoardElement.innerHTML = ''; // Clear previous state
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
                
                if (cellData.type === 'unit') {
                     // Could add more unit specific details here, e.g. P/T
                }

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
    const player1 = gameState.players['Player 1'] || gameState.players['player1']; // Adjust for potential casing differences
    const player2 = gameState.players['Player 2'] || gameState.players['player2'];

    gameStateInfoElement.innerHTML = `
        <h3>Game State</h3>
        <p><strong>Turn:</strong> ${gameState.turn}</p>
        <p><strong>Phase:</strong> ${gameState.phase}</p>
        <p><strong>Active Player:</strong> ${gameState.activePlayer}</p>
        <h4>Players</h4>
        <div class="player-info">
            <div><strong>${player1.id} (${player1.avatarName || player1.avatar?.name || 'N/A'})</strong></div>
            <div>Life: ${player1.life}, Mana: ${player1.mana}</div>
            <div>Deck: ${player1.deckStats?.spells || 'N/A'} spells, ${player1.deckStats?.sites || 'N/A'} sites</div>
            <div>Hand: ${Array.isArray(player1.hand) ? player1.hand.length : 'N/A'} cards</div>
        </div>
        <div class="player-info">
            <div><strong>${player2.id} (${player2.avatarName || player2.avatar?.name || 'N/A'})</strong></div>
            <div>Life: ${player2.life}, Mana: ${player2.mana}</div>
            <div>Deck: ${player2.deckStats?.spells || 'N/A'} spells, ${player2.deckStats?.sites || 'N/A'} sites</div>
            <div>Hand: ${Array.isArray(player2.hand) ? player2.hand.length : 'N/A'} cards</div>
        </div>
    `;
}

function displayStoryline(storyline, eventLogElement) {
    if (!eventLogElement) return;
    eventLogElement.innerHTML = '<h3>Event Log</h3>'; // Clear previous logs and add title
    storyline.forEach(eventText => {
        const p = document.createElement('p');
        p.textContent = eventText;
        eventLogElement.appendChild(p);
    });
    eventLogElement.scrollTop = eventLogElement.scrollHeight;
}

// Generic log event function (can be used for system messages)
function logEvent(message, eventLogElement) {
    if (!eventLogElement) { // Try to get it if not passed
        eventLogElement = document.getElementById('eventLog');
    }
    if (!eventLogElement) return;

    const p = document.createElement('p');
    p.className = 'system-message';
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    // If eventLogElement doesn't have its h3 title yet, add it.
    if (!eventLogElement.querySelector('h3')) {
        const title = document.createElement('h3');
        title.textContent = "Event Log";
        eventLogElement.prepend(title);
    }

    eventLogElement.appendChild(p);
    eventLogElement.scrollTop = eventLogElement.scrollHeight;
}

function displayDeckLists(gameState, player1Setup, player2Setup) {
    // Create or get deck display container
    let deckContainer = document.getElementById('deckLists');
    if (!deckContainer) {
        deckContainer = document.createElement('div');
        deckContainer.id = 'deckLists';
        deckContainer.className = 'deck-lists-container';
        
        // Insert after game state info
        const gameStateInfo = document.getElementById('gameStateInfo');
        if (gameStateInfo && gameStateInfo.parentNode) {
            gameStateInfo.parentNode.insertBefore(deckContainer, gameStateInfo.nextSibling);
        }
    }

    // Extract deck information from game state
    const player1Deck = extractPlayerDeck(gameState, 'player1', player1Setup);
    const player2Deck = extractPlayerDeck(gameState, 'player2', player2Setup);

    deckContainer.innerHTML = `
        <h3>Deck Lists</h3>
        <div class="deck-lists">
            <div class="deck-column">
                <h4>Player 1: ${player1Setup.avatar}</h4>
                <div class="deck-stats">
                    <p>Element: ${player1Setup.element}</p>
                    <p>Strategy: ${player1Setup.strategy || 'Default'}</p>
                    <p>Total Cards: ${player1Deck.length}</p>
                </div>
                <div class="deck-list">
                    ${renderDeckList(player1Deck)}
                </div>
            </div>
            <div class="deck-column">
                <h4>Player 2: ${player2Setup.avatar}</h4>
                <div class="deck-stats">
                    <p>Element: ${player2Setup.element}</p>
                    <p>Strategy: ${player2Setup.strategy || 'Default'}</p>
                    <p>Total Cards: ${player2Deck.length}</p>
                </div>
                <div class="deck-list">
                    ${renderDeckList(player2Deck)}
                </div>
            </div>
        </div>
    `;
}

function extractPlayerDeck(gameState, playerId, playerSetup) {
    // Try to get deck from game state
    const player = gameState.players && gameState.players[playerId];
    let deck = [];

    if (player) {
        // Get cards from hand and deck
        if (player.hand && player.hand.spells) {
            deck = deck.concat(player.hand.spells);
        }
        if (player.hand && player.hand.sites) {
            deck = deck.concat(player.hand.sites);
        }
        if (player.decks && player.decks.spellbook) {
            deck = deck.concat(player.decks.spellbook);
        }
        if (player.decks && player.decks.atlas) {
            deck = deck.concat(player.decks.atlas);
        }
    }

    // If no deck found, create a mock deck
    if (deck.length === 0) {
        deck = createMockDeck(playerSetup);
    }

    return deck;
}

function createMockDeck(playerSetup) {
    const element = playerSetup.element;
    const strategy = playerSetup.strategy || 'Balanced';
    const deck = [];

    // Create themed cards based on element and strategy
    const cardCount = strategy === 'Aggro' ? 50 : strategy === 'Control' ? 55 : 52;
    
    for (let i = 0; i < cardCount; i++) {
        const cardType = i % 4 === 0 ? 'Site' : 
                        i % 4 === 1 ? 'Minion' : 
                        i % 4 === 2 ? 'Magic' : 'Artifact';
        
        const cost = strategy === 'Aggro' ? Math.min(4, Math.floor(i / 10) + 1) :
                    strategy === 'Control' ? Math.floor(i / 8) + 2 :
                    Math.floor(i / 12) + 1;

        deck.push({
            name: `${element} ${cardType} ${Math.floor(i / 4) + 1}`,
            type: cardType,
            cost: cardType === 'Site' ? 0 : cost,
            element: element,
            text: `A ${strategy.toLowerCase()} ${element.toLowerCase()} ${cardType.toLowerCase()}`
        });
    }

    return deck;
}

function renderDeckList(deck) {
    if (!deck || deck.length === 0) {
        return '<p class="no-cards">No cards available</p>';
    }

    // Group cards by type
    const groupedCards = deck.reduce((groups, card) => {
        const type = card.type || card.extCardType || 'Unknown';
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(card);
        return groups;
    }, {});

    let html = '';
    
    // Sort types for consistent display
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
            const cardName = card.name || card.cleanName || 'Unknown Card';
            const cardCost = card.cost !== undefined ? card.cost : 
                           card.extCost !== undefined ? card.extCost : '?';
            const cardElement = card.element || card.extElement || '';
            
            html += `<div class="deck-card">`;
            html += `<span class="card-cost">${cardCost}</span>`;
            html += `<span class="card-name">${cardName}</span>`;
            if (cardElement) {
                html += `<span class="card-element">${cardElement}</span>`;
            }
            html += `</div>`;
        });
        
        html += `</div>`; // close card-list
        html += `</div>`; // close card-type-group
    });
    
    return html;
}
