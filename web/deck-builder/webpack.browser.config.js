const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/browser-entry.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // Map Node.js specific modules to browser alternatives
      'fs': false,
      'path': require.resolve('path-browserify'),
      'util': require.resolve('util'),
      'stream': require.resolve('stream-browserify'),
      'crypto': require.resolve('crypto-browserify'),
      'os': require.resolve('os-browserify/browser'),
    },
    fallback: {
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser"),
    }
  },
  output: {
    filename: 'deck-builder-bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'SorceryDeckBuilder',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  target: 'web',
  plugins: [
    new (require('webpack')).ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
};
