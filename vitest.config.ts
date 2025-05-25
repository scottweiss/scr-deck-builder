import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test setup
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'clover', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'web/',
        'tests/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    
    // Test files pattern
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
      'src/**/*.{test,spec}.{js,ts}'
    ],
    
    // Setup files
    setupFiles: ['./test-setup.ts'],
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Reporter
    reporters: ['verbose'],
    
    // Watch mode configuration
    watch: false,
    
    // Allow tests to run in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  },

  // Module resolution for tests
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Node.js polyfills for tests that might need them
      'path': 'path-browserify',
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'util': 'util',
      'buffer': 'buffer',
      'process': 'process/browser'
    }
  },

  // Define global constants for tests
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'global': 'globalThis'
  }
})