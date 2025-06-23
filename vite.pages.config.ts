import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Specify the root directory of the web app
  root: 'src/web',
  
  // Base path for GitHub Pages (repository name)
  base: '/scr-deck-builder/',

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true
  },

  // Build configuration for GitHub Pages
  build: {
    outDir: '../../docs',
    emptyOutDir: true,
    // Single page application for simpler deployment
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/web/index.html')
      }
    },
    sourcemap: false, // Disable sourcemaps for production
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
    'process.env.NODE_ENV': JSON.stringify('production'),
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