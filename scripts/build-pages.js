#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building for GitHub Pages...');

// Build the web application using Vite
console.log('Building web application with Vite...');
try {
  execSync('npm run build:pages:vite', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('Vite build completed successfully');
} catch (error) {
  console.error('Vite build failed:', error.message);
  process.exit(1);
}

// Verify docs directory exists
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  console.error('docs directory was not created by Vite build');
  process.exit(1);
}

// Verify index.html exists and has correct content
const indexPath = path.join(docsDir, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('Verifying index.html...');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Check if it has the correct title (should already be correct from Vite build)
  if (content.includes('<title>Sorcery: Contested Realm - Deck Builder</title>')) {
    console.log('index.html has correct title');
  } else {
    console.log('Updating title in index.html...');
    content = content.replace(/<title>.*<\/title>/, '<title>Sorcery: Contested Realm - Deck Builder</title>');
    fs.writeFileSync(indexPath, content);
    console.log('Updated index.html title');
  }
} else {
  console.error('index.html not found in docs directory');
  process.exit(1);
}

// Create a .nojekyll file to prevent Jekyll processing
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
console.log('Created .nojekyll file');

console.log('GitHub Pages build complete!');