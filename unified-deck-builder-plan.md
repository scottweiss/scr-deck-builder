# Unified Deck Builder Architecture Plan

## Problem Statement
Currently there are two separate deck building systems:
1. **TypeScript System**: Full-featured with advanced algorithms in `src/main/build-deck.ts`
2. **Browser System**: Multiple simplified JavaScript implementations in `web/deck-builder/`

This creates maintenance overhead, feature disparity, and code duplication.

## Proposed Solution: Unified TypeScript-First Architecture

### Phase 1: Create Browser-Compatible Build
1. **Bundle TypeScript for Browser**: Use webpack/rollup to compile TypeScript system for browser use
2. **Expose Clean API**: Create browser-friendly interface that wraps existing TypeScript logic
3. **Replace Multiple JS Implementations**: Remove redundant browser implementations

### Phase 2: Unified API Layer
```typescript
// New unified interface
export interface UnifiedDeckBuilder {
  // Core deck building
  buildDeck(options: DeckBuildOptions): Promise<DeckResult>
  
  // Card data access
  getAllCards(): Promise<Card[]>
  getAvatars(elementFilter?: Element[]): Promise<Card[]>
  getSites(elementFilter?: Element[]): Promise<Card[]>
  
  // Analysis capabilities
  calculateSynergy(deck: Card[]): number
  detectCombos(deck: Card[]): Combo[]
  analyzeManaRequirements(deck: Card[]): ElementRequirement[]
  validateDeck(deck: Deck): ValidationResult
}
```

### Phase 3: Implementation Strategy

#### A. Browser Bundle Configuration
- **Entry Point**: `src/browser/deck-builder-entry.ts`
- **Build Tool**: Webpack with TypeScript loader
- **Output**: Single `sorcery-deck-builder.js` bundle
- **Polyfills**: For Node.js modules (fs, path, etc.)

#### B. API Adapter Layer
```typescript
// Browser-specific adapter
export class BrowserDeckBuilder implements UnifiedDeckBuilder {
  private coreBuilder: DeckBuilder;
  private cardData: ProcessedCardData;
  
  async initialize(): Promise<void> {
    // Load card data (from compressed format or API)
    this.cardData = await this.loadBrowserCardData();
    this.coreBuilder = new DeckBuilder(this.cardData);
  }
  
  async buildDeck(options: DeckBuildOptions): Promise<DeckResult> {
    // Use existing TypeScript logic
    return this.coreBuilder.buildCompleteDeck(options);
  }
}
```

#### C. Web Interface Update
- **Single Integration**: Replace multiple JS files with single bundle
- **Rich Features**: Expose all TypeScript capabilities (synergy, combos, optimization)
- **Type Safety**: Benefit from TypeScript's type checking

### Phase 4: Benefits of Unified System

#### For Developers
- **Single Source of Truth**: All deck building logic in TypeScript
- **Better Testing**: Comprehensive test suite for one system
- **Type Safety**: Fewer runtime errors
- **Advanced Features**: Synergy calculation, combo detection in web UI

#### For Users  
- **Consistent Experience**: Same algorithms in CLI and web
- **Better Decks**: Access to optimization and analysis features
- **Rich Feedback**: Detailed validation and suggestions

#### For Maintenance
- **No Code Duplication**: Single implementation to maintain
- **Easier Updates**: New features automatically available everywhere
- **Better Documentation**: One system to document

### Implementation Steps

1. **Create Browser Entry Point**
   ```bash
   src/browser/
   ├── deck-builder-entry.ts    # Main browser interface
   ├── browser-adapter.ts       # Browser-specific utilities
   └── webpack.config.js        # Build configuration
   ```

2. **Build Configuration**
   ```javascript
   // webpack.config.js
   module.exports = {
     entry: './src/browser/deck-builder-entry.ts',
     output: {
       filename: 'sorcery-deck-builder.js',
       library: 'SorceryDeckBuilder',
       libraryTarget: 'umd'
     },
     resolve: {
       extensions: ['.ts', '.js'],
       fallback: {
         'fs': false,
         'path': require.resolve('path-browserify')
       }
     }
   };
   ```

3. **Update Web Interface**
   - Replace multiple JS files with single bundle
   - Update HTML to use unified API
   - Enhance UI with new capabilities

4. **Deprecate Old System**
   - Mark browser-specific JS files as deprecated
   - Provide migration guide
   - Eventually remove redundant code

### Migration Timeline
- **Week 1**: Create browser bundle and entry point
- **Week 2**: Build and test unified interface
- **Week 3**: Update web UI to use new system
- **Week 4**: Remove deprecated browser implementations

This approach eliminates the dual system problem while leveraging the sophisticated TypeScript implementation for both CLI and web use cases.
