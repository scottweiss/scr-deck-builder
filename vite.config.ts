import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Specify the root directory of the web app
  root: 'src/web',

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true
  },

  // Build configuration
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    // Multi-page application setup
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/web/index.html'),
        // Keep the library build as well
        lib: resolve(__dirname, 'src/browser/browser-entry.ts')
      },
      external: [],
      output: {
        exports: 'named',
        globals: {}
      }
    },
    sourcemap: true,
    target: 'es2020'
  },

  // Module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
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
