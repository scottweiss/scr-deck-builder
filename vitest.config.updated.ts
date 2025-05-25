import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test-setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'web'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'web/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Support CommonJS require paths with aliases for all relative paths
      '../../../analyses/synergy/synergyCalculator': resolve(__dirname, 'src/analyses/synergy/synergyCalculator'),
      '../../cards/cardCombos': resolve(__dirname, 'src/core/cards/cardCombos'),
      '../utils/utils': resolve(__dirname, 'src/utils/utils'),
      '../../analyses/synergy/deckStats': resolve(__dirname, 'src/analyses/synergy/deckStats'),
      '../../analyses/synergy/elementalSynergy': resolve(__dirname, 'src/analyses/synergy/elementalSynergy'),
      '../../analyses/synergy/mechanicalSynergy': resolve(__dirname, 'src/analyses/synergy/mechanicalSynergy'),
      '../../analyses/synergy/costCurveSynergy': resolve(__dirname, 'src/analyses/synergy/costCurveSynergy'),
      '../../analyses/synergy/comboContribution': resolve(__dirname, 'src/analyses/synergy/comboContribution'),
      '../../analyses/synergy/deckAnalysisCache': resolve(__dirname, 'src/analyses/synergy/deckAnalysisCache'),
      // Browser polyfills for Node.js modules
      'path': 'path-browserify',
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'util': 'util',
      'buffer': 'buffer',
      'process': 'process/browser'
    },
    extensions: ['.ts', '.js', '.json']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'global': 'globalThis'
  }
})
