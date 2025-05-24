// Quick test to verify deck building works
const fs = require('fs');
let output = '';

function log(message) {
    output += message + '\n';
    console.log(message);
}

log('=== Testing Deck Builder ===');

// Test the buildSites function directly
function buildSites(availableSites, preferredElements = []) {
    if (!availableSites || availableSites.length === 0) {
        console.log('No sites available');
        log('No sites available');
        return [];
    }
    
    console.log(`Building sites from ${availableSites.length} available sites`);
    log(`Building sites from ${availableSites.length} available sites`);
    
    const sites = [];
    const targetSitesCount = 30;
    
    // Sort sites by preference
    const sortedSites = [...availableSites].sort((a, b) => {
        if (preferredElements.length > 0) {
            const aElementMatch = a.elements ? a.elements.some(e => preferredElements.includes(e)) : false;
            const bElementMatch = b.elements ? b.elements.some(e => preferredElements.includes(e)) : false;
            
            if (aElementMatch && !bElementMatch) return -1;
            if (!aElementMatch && bElementMatch) return 1;
        }
        return 0;
    });
    
    // Add sites to deck (up to 4 of each)
    for (const site of sortedSites) {
        if (sites.length >= targetSitesCount) break;
        
        const copiesInDeck = sites.filter(s => s.name === site.name).length;
        const copiesToAdd = Math.min(4 - copiesInDeck, targetSitesCount - sites.length);
        
        for (let i = 0; i < copiesToAdd; i++) {
            sites.push({ ...site });
        }
    }
    
    console.log(`Built ${sites.length} sites`);
    log(`Built ${sites.length} sites`);
    return sites;
}

// Create mock site data
const mockSites = [
    { name: 'Fire Temple', type: 'Site', elements: ['Fire'] },
    { name: 'Water Grove', type: 'Site', elements: ['Water'] },
    { name: 'Earth Cavern', type: 'Site', elements: ['Earth'] },
    { name: 'Air Peak', type: 'Site', elements: ['Air'] },
    { name: 'Neutral Ground', type: 'Site', elements: [] },
    { name: 'Mixed Grove', type: 'Site', elements: ['Fire', 'Water'] },
    { name: 'Ancient Ruins', type: 'Site', elements: ['Earth', 'Air'] },
    { name: 'Sacred Site', type: 'Site', elements: ['Water', 'Earth'] }
];

// Test site building
log('\n--- Testing with Fire preference ---');
const fireSites = buildSites(mockSites, ['Fire']);
log('Fire-preferred sites: ' + fireSites.map(s => s.name).join(', '));

log('\n--- Testing with no preference ---');
const allSites = buildSites(mockSites, []);
log('All sites: ' + allSites.map(s => s.name).join(', '));

console.log('\n=== Test Complete ===');
log('\n=== Test Complete ===');

// Write output to file
fs.writeFileSync('test-output.txt', output);
