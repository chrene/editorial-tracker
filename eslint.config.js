import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['**/dist', '**/node_modules', 'pnpm-lock.yaml']),

  // All TypeScript across the workspace
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },

  // Frontend: React, browser globals
  {
    files: ['packages/frontend/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Backend + shared: Node globals
  {
    files: ['packages/{backend,shared}/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Config files run in Node
  {
    files: ['*.js', '**/*.config.{js,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  prettier,
]);
