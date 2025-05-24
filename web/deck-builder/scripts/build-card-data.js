// Build script to generate card data for the browser
const fs = require('fs');
const path = require('path');

// We'll use Node.js to run the existing TypeScript card loading functions
// and generate a JavaScript file with the card data embedded

const buildCardData = async () => {
    console.log('Building card data for browser...');
    
    try {
        // We need to compile and run the TypeScript code to get card data
        // For now, we'll create a simplified version that can be expanded
        
        const cardDataTemplate = `
// Auto-generated card data for browser deck builder
// Generated on: ${new Date().toISOString()}

window.SORCERY_CARD_DATA = {
    // Card data will be populated by the build process
    cards: [],
    avatars: [],
    sites: [],
    minions: [],
    artifacts: [],
    auras: [],
    magics: [],
    lastUpdated: "${new Date().toISOString()}"
};

// Helper function to load card data
window.loadSorceryCardData = function() {
    return window.SORCERY_CARD_DATA;
};

console.log('Card data loaded:', window.SORCERY_CARD_DATA.cards.length + ' cards');
`;
        
        // Write the card data file
        const outputPath = path.join(__dirname, '..', 'card-data.js');
        fs.writeFileSync(outputPath, cardDataTemplate);
        
        console.log(`Card data written to: ${outputPath}`);
        console.log('Note: This is a template. Full card data integration requires TypeScript compilation.');
        
    } catch (error) {
        console.error('Error building card data:', error);
        process.exit(1);
    }
};

// Run the build
buildCardData();
