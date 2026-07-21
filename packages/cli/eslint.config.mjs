import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import typescriptEslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default typescriptEslint.config([
  eslintPluginUnicorn.configs.recommended,
  eslintPluginPrettierRecommended,
  js.configs.recommended,
  typescriptEslint.configs.recommended,
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: typescriptEslint.parser,
      ecmaVersion: 5,
      sourceType: 'module',

      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      'unicorn/prefer-module': 'off',
      'unicorn/name-replacements': 'off',
      'unicorn/no-unreadable-for-of-expression': 'off',
      'unicorn/no-declarations-before-early-exit': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/import-style': 'off',
      'unicorn/consistent-class-member-order': 'off',
      'unicorn/prefer-simple-condition-first': 'off',
      curly: 2,
      // prefer the typescript-eslint type-aware version
      'unicorn/require-array-sort-compare': 'off',
      '@typescript-eslint/require-array-sort-compare': 'error',
      'prettier/prettier': 0,
      'object-shorthand': ['error', 'always'],
    },
  },
]);
