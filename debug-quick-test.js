const { QuickAITestRunner } = require('./dist/core/simulation/testing/aiVsAiTests.js');

async function test() {
  try {
    console.log('Running QuickAITestRunner...');
    const result = await QuickAITestRunner.runQuickTests();
    console.log('Test result:', result);
  } catch (error) {
    console.log('Test error:', error);
    console.log('Error stack:', error.stack);
  }
}

test();
