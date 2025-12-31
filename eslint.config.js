/**
 * ESLint Configuration
 * 
 * Comprehensive linting rules for TypeScript and React codebase.
 * Enforces code quality, best practices, and consistency.
 * 
 * @module eslint.config
 */

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Global ignores
  { ignores: ['dist', 'node_modules', '*.config.js'] },
  
  // JavaScript/TypeScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...js.configs.recommended,
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Code quality
      'no-unused-vars': ['error', { 
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
      }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      
      // Best practices
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-arrow-callback': 'warn',
      
      // React specific
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  
  // TypeScript specific rules
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off', // Turn off base rule as it conflicts with TypeScript version
      '@typescript-eslint/no-unused-vars': ['error', { 
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
      }],
    },
  },
];
