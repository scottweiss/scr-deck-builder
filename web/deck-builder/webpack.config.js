const path = require('path');

module.exports = {
  entry: './src/browser-deck-builder.ts',
  output: {
    filename: 'deck-builder.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'SorceryDeckBuilder',
    libraryTarget: 'window',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, '../../src')
    },
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
      "process": false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  plugins: [],
  devServer: {
    static: {
      directory: path.join(__dirname),
    },
    compress: true,
    port: 3000,
    open: true
  },
  target: 'web',
  mode: 'development',
  devtool: 'source-map'
};
