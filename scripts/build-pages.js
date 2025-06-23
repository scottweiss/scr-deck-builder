#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building for GitHub Pages...');

// Create docs directory
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Copy files from html directory
const htmlDir = path.join(__dirname, '..', 'html');
if (fs.existsSync(htmlDir)) {
  console.log('Copying files from html directory...');
  copyDirectory(htmlDir, docsDir);
} else {
  console.error('html directory does not exist. Please build the project first.');
  process.exit(1);
}

// Update index.html for GitHub Pages
const indexPath = path.join(docsDir, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('Updating index.html for GitHub Pages...');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Update title
  content = content.replace(/<title>.*<\/title>/, '<title>Sorcery: Contested Realm - Deck Builder</title>');
  
  // The paths are already relative, so no changes needed for GitHub Pages
  // But we could add base path if needed in the future
  
  fs.writeFileSync(indexPath, content);
  console.log('Updated index.html successfully');
}

// Create a .nojekyll file to prevent Jekyll processing
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
console.log('Created .nojekyll file');

console.log('GitHub Pages build complete!');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}