import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Library mode for browser bundle (separate from web app)
  build: {
    lib: {
      entry: resolve(__dirname, 'src/browser/browser-entry.ts'),
      name: 'SorceryDeckBuilder',
      fileName: (format) => `sorcery-deck-builder.${format}.js`,
      formats: ['umd', 'es']
    },
    rollupOptions: {
      external: [],
      output: {
        exports: 'named',
        globals: {}
      }
    },
    sourcemap: true,
    target: 'es2020',
    outDir: 'dist/lib'
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'path': 'path-browserify',
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'util': 'util',
      'buffer': 'buffer',
      'process': 'process/browser'
    }
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'global': 'globalThis'
  },

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
