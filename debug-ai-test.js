// Debug script to test AI behavior directly
import { QuickAITestRunner } from './src/core/simulation/testing/aiVsAiTests.js';

console.log('🐛 Debug AI Test...');

try {
    const result = await QuickAITestRunner.runQuickTests();
    console.log('Result:', result);
} catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
}
