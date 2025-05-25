# Modern Sorcery Deck Builder Web Application

This is a modern web application built with Vite, TypeScript, and Web Components for the Sorcery: Contested Realm deck builder.

## Features

- 🎯 **Modern Architecture**: Built with TypeScript and Web Components
- ⚡ **Fast Development**: Powered by Vite for instant hot reload
- 🎨 **Beautiful UI**: Modern CSS with custom properties and responsive design
- 🃏 **Complete Deck Building**: Full integration with the TypeScript deck builder
- 🔍 **Advanced Search**: Filter and search through all cards
- 📊 **Detailed Analytics**: Mana curves, element distribution, synergy scores
- 📤 **Export Options**: Export decks as text, JSON, or copy to clipboard

## Architecture

### Web Components
- `DeckBuilderApp`: Main application component with deck building controls
- `DeckDisplayComponent`: Shows built decks with detailed breakdown and stats
- `CardSearchComponent`: Advanced card search and filtering functionality

### Modern Features
- CSS Custom Properties for theming
- TypeScript for type safety
- Module-based architecture
- Responsive design
- Modern ES2020+ features

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Build library bundle
npm run build:lib
```

## Usage

The application automatically loads when you open the page. No manual initialization required.

### Building Decks
1. Select your preferred element and archetype
2. Choose deck size (30-60 cards)
3. Optionally specify an avatar
4. Click "Build Random Deck"

### Searching Cards
1. Click "Search Cards"
2. Enter search terms
3. Use filters to narrow results by type, element, or mana cost

### Exporting Decks
- Export as formatted text file
- Export as JSON data
- Copy deck list to clipboard

## Comparison to Legacy System

### Before (Legacy HTML/JS)
- Vanilla JavaScript with global variables
- Inline styles and basic CSS
- Manual DOM manipulation
- No type safety
- No build process

### After (Modern Vite/TS)
- TypeScript with full type safety
- Web Components for modularity
- CSS custom properties and modern styling
- Vite for fast development and optimized builds
- Component-based architecture
- Modern ES modules

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

All modern browsers with native Web Components support.
