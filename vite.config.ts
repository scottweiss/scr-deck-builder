import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true
  },

  // Build configuration
  build: {
    // Library mode for browser bundle
    lib: {
      entry: resolve(__dirname, 'src/browser/browser-entry.ts'),
      name: 'SorceryDeckBuilder',
      fileName: (format) => `sorcery-deck-builder.${format}.js`,
      formats: ['umd', 'es']
    },
    rollupOptions: {
      // Externalize Node.js specific modules for cleaner browser bundle
      external: [],
      output: {
        exports: 'named',
        globals: {}
      }
    },
    sourcemap: true,
    target: 'es2015',
    outDir: 'dist'
  },

  // Module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Browser polyfills for Node.js modules
      'path': 'path-browserify',
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'util': 'util',
      'buffer': 'buffer',
      'process': 'process/browser'
    }
  },

  // Plugins
  plugins: [],

  // Define global constants
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'global': 'globalThis'
  },

  // Optimization
  optimizeDeps: {
    include: [
      'path-browserify',
      'crypto-browserify', 
      'stream-browserify',
      'util',
      'buffer',
      'process/browser'
    ]
  }
})
