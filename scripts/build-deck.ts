#!/usr/bin/env node

/**
 * Convenience script to build a Sorcery: Contested Realm deck
 * This script forwards all arguments to the main build-deck.ts
 */

import path from 'path';
import { spawn } from 'child_process';

// Path to the actual build-deck.ts file
const scriptPath: string = path.join(__dirname, '..', 'src', 'main', 'build-deck.ts');

// Forward all arguments to the main script
const args: string[] = process.argv.slice(2);
// Ensure NODE_OPTIMIZED is passed to the child process if it's set for the parent
const env = { ...process.env };
const child = spawn('node', ['-r', 'ts-node/register', scriptPath, ...args], { env, stdio: ['inherit', 'pipe', 'pipe'] });

// Explicitly pipe stdout and stderr
if (child.stdout) {
  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
}

if (child.stderr) {
  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
}

// Handle process completion
child.on('close', (code: number | null) => {
  process.exit(code || 0);
});
