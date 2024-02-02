import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@test-utils': new URL('../../../server/dist/test-utils/utils.js', import.meta.url).pathname,
    },
  },
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    globalSetup: 'test/e2e/setup.ts',
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
        minForks: 1,
      },
    },
    testTimeout: 10_000,
  },
});
