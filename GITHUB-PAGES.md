# GitHub Pages Setup

This repository is configured with GitHub Pages to automatically deploy the deck builder web application.

## Automatic Deployment

- **Trigger**: Pushes to the `main` branch
- **Build**: Uses the existing `html/` directory with pre-built assets  
- **Deploy**: Static files are deployed to GitHub Pages
- **URL**: https://scottweiss.github.io/scr-deck-builder/

## Build Process

1. GitHub Actions runs on push to main
2. Installs dependencies with `npm ci`
3. Builds static files with `npm run build:pages`
4. Copies and processes assets from `html/` to `docs/`
5. Deploys `docs/` directory to GitHub Pages

## Local Testing

To test the GitHub Pages build locally:

```bash
npm run build:pages
cd docs
python -m http.server 8000
# Or use any static file server
```

## Files

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `scripts/build-pages.js` - Build script for GitHub Pages
- `vite.pages.config.ts` - Vite configuration for GitHub Pages
- `docs/` - Output directory (gitignored, created during build)

## Configuration

The build process:
- Updates page title to "Sorcery: Contested Realm - Deck Builder"
- Creates `.nojekyll` file to prevent Jekyll processing
- Preserves all asset paths as relative URLs
- Copies favicons and other static assets