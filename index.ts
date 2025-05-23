/**
 * Sorcery: Contested Realm Deck Building System
 * Main entry point
 */

import path from 'path';
import { spawn } from 'child_process';

console.log('Starting Sorcery: Contested Realm Deck Building System...');

// Forward all arguments to the main script
const args: string[] = process.argv.slice(2);
const scriptPath: string = path.join(__dirname, 'src', 'main', 'build-deck.ts');

// Set optimized mode as default
process.env.NODE_OPTIMIZED = 'true';

const child = spawn('node', ['-r', 'ts-node/register', scriptPath, ...args], { 
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIMIZED: 'true' }
});

// Handle process completion
child.on('close', (code: number | null) => {
  process.exit(code || 0);
});
