import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/api/specs/*.e2e-spec.ts'],
    globalSetup: ['src/api/setup.ts'],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
