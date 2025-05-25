const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import': importPlugin,
    },
    rules: {
      // Convert CommonJS to ES6 modules
      'import/no-commonjs': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      
      // Other helpful rules
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      }],
      'import/newline-after-import': 'error',
    },
  },
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      '**/*.js',
      'webpack.*.js',
      'vite.config.ts',
      'vitest.config.ts',
      'src/data/processed/sorceryCards.compressed.js',
      'src/data/processed/sorceryCards.generated.js',
      'web/**/*.js',
    ],
  },
];
