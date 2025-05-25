# Vite/Vitest Migration Plan for Sorcery: Contested Realm

## Migration Overview

**Project**: Large TypeScript deck building system with unified CLI/browser architecture
**Current**: Webpack + custom test scripts
**Target**: Vite + Vitest
**Estimated Timeline**: 1-2 weeks
**Complexity**: Low-Medium (well-structured TypeScript codebase)

## Pre-Migration Assessment

### Current Build System Analysis
- **4 webpack configurations** (main + 3 web components)
- **Complex polyfills** for Node.js modules in browser
- **TypeScript-first architecture** (excellent for Vite)
- **Unified API layer** already implemented
- **Custom testing** without formal framework

### Benefits Expected
- **10x faster development builds** (native ES modules + esbuild)
- **Simplified configuration** (1-2 configs vs 4 webpack configs)
- **Integrated testing framework** (Vitest with TypeScript support)
- **Better HMR** and development experience
- **Modern tooling** alignment

## Migration Phases

### Phase 1: Vite Build System Setup ✨ [NEXT]

**Goal**: Replace webpack with Vite for development and production builds

#### 1.1 Install Vite Dependencies
```bash
npm install --save-dev vite @vitejs/plugin-legacy
npm install --save-dev @types/node # if not already installed
```

#### 1.2 Create Vite Configuration
- `vite.config.ts` - Main configuration
- Support for both library build and development server
- Handle Node.js polyfills efficiently

#### 1.3 Update Package Scripts
- Replace webpack build commands
- Add Vite development server
- Maintain compatibility with existing workflows

#### 1.4 Browser Entry Point Adjustments
- Ensure `src/browser/browser-entry.ts` works with Vite
- Update module resolution if needed

### Phase 2: Vitest Testing Framework 🧪

**Goal**: Replace custom test scripts with comprehensive Vitest test suite

#### 2.1 Install Vitest
```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-c8
```

#### 2.2 Convert Existing Tests
- **Deck building tests** → `tests/deck-builder.test.ts`
- **Synergy calculation tests** → `tests/synergy.test.ts`
- **Simulation tests** → `tests/simulation.test.ts`
- **Integration tests** → `tests/integration.test.ts`

#### 2.3 Test Configuration
- TypeScript support out of the box
- Coverage reporting setup
- Test environment configuration for browser/Node.js compatibility

### Phase 3: Development Experience Improvements 🚀

**Goal**: Leverage Vite's development features

#### 3.1 Hot Module Replacement
- Configure HMR for web development
- Test browser deck builder with live reloading

#### 3.2 Development Server Integration
- Replace/enhance Express server with Vite dev server for development
- Maintain API endpoints for deck building

#### 3.3 Build Optimization
- Optimize bundle size
- Configure proper code splitting
- Ensure browser compatibility

### Phase 4: Migration Verification & Cleanup 🔍

**Goal**: Ensure everything works and clean up

#### 4.1 Verification
- All builds work correctly
- Tests pass
- Browser functionality intact
- CLI functionality preserved

#### 4.2 Cleanup
- Remove webpack configurations
- Remove outdated dependencies
- Update documentation

## Detailed Implementation Plan

### Files to Create/Modify

#### New Files
- `vite.config.ts` - Main Vite configuration
- `vitest.config.ts` - Testing configuration (if separate needed)
- `tests/*.test.ts` - New test files using Vitest

#### Files to Modify
- `package.json` - Scripts and dependencies
- `tsconfig.json` - Potentially adjust for Vite
- `src/browser/browser-entry.ts` - Ensure Vite compatibility

#### Files to Remove (Phase 4)
- `webpack.browser.config.js`
- `web/deck-builder/webpack.config.js`
- `web/deck-builder/webpack.browser.config.js`
- `web/simulation/webpack.config.js`

### Dependency Changes

#### Add
```json
{
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-legacy": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-c8": "^0.33.0"
  }
}
```

#### Remove (Phase 4)
```json
{
  "devDependencies": {
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "ts-loader": "^9.5.1"
  }
}
```

### Configuration Strategy

#### Vite Config Approach
1. **Library mode** for browser bundle
2. **Development server** for web interface
3. **Node.js polyfills** only where needed
4. **TypeScript integration** out of the box

#### Testing Strategy
1. **Unit tests** for core functionality
2. **Integration tests** for deck building pipeline
3. **Browser tests** for unified deck builder
4. **Performance benchmarks** to ensure no regression

## Risk Assessment & Mitigation

### Low Risks ✅
- **TypeScript compatibility** - Vite has excellent TS support
- **Module structure** - Your modular approach works perfectly with Vite
- **Development workflow** - Improvement expected

### Medium Risks ⚠️
- **Node.js polyfills** - Need to ensure browser/Node.js compatibility maintained
- **Express server integration** - May need adjustments for development
- **Bundle output compatibility** - Ensure web interface still works

### Mitigation Strategies
1. **Incremental migration** - Start with development, then production
2. **Parallel testing** - Keep webpack until Vite is fully verified
3. **Comprehensive testing** - Test all functionality after each phase
4. **Rollback plan** - Git branches for easy reversion

## Success Metrics

### Performance
- **Development build time**: < 1 second (vs current ~10-30 seconds)
- **Hot reload time**: < 500ms
- **Test execution**: Complete suite in < 10 seconds

### Developer Experience
- **Single configuration file** instead of 4 webpack configs
- **Built-in test runner** with coverage
- **Better debugging** with improved source maps

### Functionality
- **All existing features work** (deck building, simulation, etc.)
- **Browser/CLI compatibility** maintained
- **Web interface** fully functional

## Implementation Schedule

### Week 1
- **Days 1-2**: Phase 1 (Vite setup)
- **Days 3-4**: Phase 2 (Vitest setup)
- **Day 5**: Phase 3 (Development improvements)

### Week 2
- **Days 1-2**: Phase 4 (Verification & cleanup)
- **Days 3-5**: Documentation updates and optimization

## Next Steps

1. **Start Phase 1** - Install Vite and create initial configuration
2. **Test basic build** - Ensure TypeScript compilation works
3. **Verify browser bundle** - Test unified deck builder functionality
4. **Incremental testing** - Validate each component as we migrate

---

**Note**: This migration leverages your excellent TypeScript-first architecture. The unified deck builder system you've already implemented makes this migration much easier than it would be for most projects.
