// Manual test script for the deck builder UI
// Run this in the browser console on the main deck builder page

(async function testDeckBuilderUI() {
    console.log('🧪 Starting UI tests...');
    
    // Wait for deck builder to be ready
    let attempts = 0;
    while (!window.deckBuilder && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.deckBuilder) {
        console.error('❌ Deck builder not available in window scope');
        return;
    }
    
    console.log('✅ Deck builder available');
    
    // Test 1: Check element checkboxes
    const elementCheckboxes = document.querySelectorAll('input[name="elements[]"]');
    console.log(`✅ Found ${elementCheckboxes.length} element checkboxes`);
    
    // Test 2: Check avatar dropdown
    const avatarSelect = document.getElementById('avatar');
    if (avatarSelect) {
        console.log(`✅ Avatar dropdown found with ${avatarSelect.options.length} options`);
    } else {
        console.error('❌ Avatar dropdown not found');
    }
    
    // Test 3: Simulate element selection
    console.log('🔧 Testing element selection...');
    
    // Select Water element
    const waterCheckbox = document.getElementById('elementWater');
    if (waterCheckbox) {
        waterCheckbox.checked = true;
        waterCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Wait for avatar dropdown to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const avatarOptionsAfterWater = avatarSelect.options.length;
        console.log(`✅ After selecting Water: ${avatarOptionsAfterWater} avatar options`);
    }
    
    // Test 4: Test deck building
    console.log('🔧 Testing deck building...');
    
    try {
        const form = document.getElementById('deckBuilderForm');
        if (form) {
            // Create a submit event
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
            
            console.log('✅ Deck build initiated');
            
            // Wait for build to complete (check for results)
            let buildAttempts = 0;
            while (buildAttempts < 100) { // Wait up to 10 seconds
                const resultsDiv = document.getElementById('results');
                if (resultsDiv && !resultsDiv.classList.contains('hidden')) {
                    console.log('✅ Deck build completed - results visible');
                    
                    // Check for avatar display
                    const avatarInfo = document.getElementById('avatarInfo');
                    if (avatarInfo && avatarInfo.innerHTML.includes('avatar-card')) {
                        console.log('✅ Avatar information displayed in results');
                    } else if (avatarInfo && avatarInfo.innerHTML.includes('No avatar selected')) {
                        console.error('❌ "No avatar selected" message found - avatar selection failed');
                    } else {
                        console.log('📝 Avatar info:', avatarInfo?.innerHTML || 'Not found');
                    }
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                buildAttempts++;
            }
            
            if (buildAttempts >= 100) {
                console.error('❌ Deck build did not complete within 10 seconds');
            }
        }
    } catch (error) {
        console.error('❌ Error during deck building test:', error);
    }
    
    console.log('🏁 UI tests completed');
})();
