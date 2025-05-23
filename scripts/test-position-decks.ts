#!/usr/bin/env node

/**
 * Convenience script to run position deck tests
 */

import path from 'path';
import { spawn } from 'child_process';

// Path to the actual test script
const scriptPath: string = path.join(__dirname, '..', 'src', 'tests', 'test-position-decks.ts');

// Forward all arguments to the main script
const args: string[] = process.argv.slice(2);
const child = spawn('node', ['-r', 'ts-node/register', scriptPath, ...args], { stdio: 'inherit' });

// Handle process completion
child.on('close', (code: number | null) => {
  process.exit(code || 0);
});
