const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/browser/unified-deck-builder.ts',
  
  output: {
    path: path.resolve(__dirname, '../web/deck-builder/dist'),
    filename: 'sorcery-deck-builder.js',
    library: 'SorceryDeckBuilder',
    libraryTarget: 'umd',
    globalObject: 'this'
  },

  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      // Node.js polyfills for browser
      'fs': false,
      'path': require.resolve('path-browserify'),
      'crypto': require.resolve('crypto-browserify'),
      'stream': require.resolve('stream-browserify'),
      'buffer': require.resolve('buffer'),
      'process': require.resolve('process/browser'),
      'util': require.resolve('util'),
      'os': false,
      'perf_hooks': false
    }
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),
    
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ],

  optimization: {
    minimize: true
  },

  // Ignore Node.js specific modules that aren't needed in browser
  externals: {
    'fsevents': 'commonjs fsevents'
  }
};
