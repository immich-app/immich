import js from '@eslint/js';
import tslintPluginCompat from '@koddsson/eslint-plugin-tscompat';
import prettier from 'eslint-config-prettier';
import eslintPluginCompat from 'eslint-plugin-compat';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parser from 'svelte-eslint-parser';
import typescriptEslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default typescriptEslint.config(
  ...eslintPluginSvelte.configs.recommended,
  eslintPluginUnicorn.configs.recommended,
  js.configs.recommended,
  prettier,
  {
    plugins: {
      tscompat: tslintPluginCompat,
    },
    rules: {
      'tscompat/tscompat': [
        'error',
        {
          browserslist: fs
            .readFileSync(path.join(__dirname, '.browserslistrc'), 'utf8')
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#')),
        },
      ],
    },
    languageOptions: {
      parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    ignores: ['**/service-worker/**'],
  },
  {
    plugins: {
      compat: eslintPluginCompat,
    },
    settings: {
      polyfills: [],
      lintAllEsApis: true,
    },
    rules: {
      'compat/compat': 'error',
    },
  },
  {
    ignores: [
      '**/.DS_Store',
      '**/node_modules',
      'build',
      '.svelte-kit',
      'package',
      '**/.env',
      '**/.env.*',
      '!**/.env.example',
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',
      '**/svelte.config.js',
      'eslint.config.js',
      'tailwind.config.js',
      'coverage',
    ],
  },
  typescriptEslint.configs.recommended,
  {
    plugins: {
      svelte: eslintPluginSvelte,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        NodeJS: true,
      },

      parser: typescriptEslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',

      parserOptions: {
        extraFileExtensions: ['.svelte'],
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
    },

    ignores: ['**/service-worker/**'],

    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_$',
          varsIgnorePattern: '^_$',
        },
      ],

      curly: 2,
      'unicorn/no-array-reverse': 'off', // toReversed() is not supported in Chrome 109 or Safari 15.4
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/import-style': 'off',
      'svelte/button-has-type': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      'object-shorthand': ['error', 'always'],
    },
  },
  {
    files: ['**/*.svelte'],

    languageOptions: {
      parser: parser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
  },
);
