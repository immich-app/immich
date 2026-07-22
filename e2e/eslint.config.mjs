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
    ignores: ['eslint.config.mjs'],
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
      'unicorn/import-style': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/no-non-function-verb-prefix': 'off',
      'unicorn/no-unreadable-for-of-expression': 'off',
      'unicorn/max-nested-calls': 'off',
      'unicorn/prefer-uint8array-base64': 'off',
      'unicorn/isolated-functions': 'off',
      'unicorn/prefer-promise-with-resolvers': 'off',
      'unicorn/no-declarations-before-early-exit': 'off',
      'unicorn/prefer-simple-condition-first': 'off',
      curly: 2,
      'prettier/prettier': 0,
      'unicorn/name-replacements': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prefer-event-target': 'off',
      'unicorn/no-thenable': 'off',
      'object-shorthand': ['error', 'always'],
    },
  },
]);
