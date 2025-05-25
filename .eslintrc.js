import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
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
      
      // Prefer ES6 imports
      'import/prefer-default-export': 'off',
      'import/no-default-export': 'off',
      
      // Other helpful rules
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      }],
      'import/newline-after-import': 'error',
    },
    languageOptions: {
      globals: {
        node: true,
        es2020: true,
      },
    },
  },
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      '**/*.js',
      'vite.config.ts',
      'vitest.config.ts',
      'src/data/processed/sorceryCards.compressed.js',
      'src/data/processed/sorceryCards.generated.js',
      'web/**/*.js',
    ],
  },
];
