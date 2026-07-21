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
      'unicorn/name-replacements': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prefer-event-target': 'off',
      'unicorn/no-thenable': 'off',
      'unicorn/import-style': 'off',
      'unicorn/prefer-structured-clone': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-unreadable-for-of-expression': 'off',
      'unicorn/no-break-in-nested-loop': 'off',
      'unicorn/no-top-level-assignment-in-function': 'off',
      'unicorn/prefer-uint8array-base64': 'off',
      'unicorn/max-nested-calls': 'off',
      'unicorn/no-declarations-before-early-exit': 'off',
      'unicorn/no-unreadable-object-destructuring': 'off',
      // maybe we do want to enable this later. TBD
      'unicorn/prefer-await': 'off',
      'unicorn/consistent-class-member-order': 'off',
      'unicorn/class-reference-in-static-methods': ['error', { preferThis: false, preferSuper: false }],
      'unicorn/no-unsafe-property-key': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/no-computed-property-existence-check': 'off',
      'unicorn/no-non-function-verb-prefix': 'off',
      // prefer the typescript-eslint type-aware version
      'unicorn/require-array-sort-compare': 'off',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': ['error', { considerDefaultExhaustiveForUnions: true }],
      'require-await': 'off',
      '@typescript-eslint/require-await': 'error',
      curly: 2,
      'prettier/prettier': 0,
      'object-shorthand': ['error', 'always'],

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['.*'],
              message: 'Relative imports are not allowed.',
            },
          ],
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
]);
