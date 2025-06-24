# GitHub Pages Setup

This repository is configured with GitHub Pages to automatically deploy the deck builder web application.

## Automatic Deployment

- **Trigger**: Pushes to the `main` branch
- **Build**: Builds the web application from `src/web/` using Vite  
- **Deploy**: Static files are deployed to GitHub Pages
- **URL**: https://scottweiss.github.io/scr-deck-builder/

## Build Process

1. GitHub Actions runs on push to main
2. Installs dependencies with `npm ci`
3. Builds static files with `npm run build:pages`
4. Uses Vite to build the web application from `src/web/` to `docs/`
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
- Builds the web application using Vite from `src/web/` directory
- Ensures page title is "Sorcery: Contested Realm - Deck Builder"
- Creates `.nojekyll` file to prevent Jekyll processing
- Generates optimized assets with proper base path for GitHub Pages
- Outputs to `docs/` directory for deployment