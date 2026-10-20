// ESLint finds likely bugs (unused variables, misused React hooks, ...).
// Formatting is Prettier's job, so eslint-config-prettier (last) switches off
// every ESLint rule that would argue with it. One config for the whole repo.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  // Generated or built files: not ours to lint.
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    'server/src/generated/',
    'server/prisma/migrations/',
  ]),

  // Every JS file: ESLint's recommended rules.
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      // `_error` style names mark parameters we must accept but don't use.
      // ignoreRestSiblings allows `const { passwordHash, ...user } = row` to drop a field.
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true },
      ],
    },
  },

  // Code that runs in Node: the server, and config files.
  {
    files: ['server/**/*.js', '*.js', 'client/vite.config.js'],
    languageOptions: { globals: globals.node },
  },

  // The React app: browser globals, JSX, and the React rules.
  {
    files: ['client/src/**/*.{js,jsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  prettier,
]);
