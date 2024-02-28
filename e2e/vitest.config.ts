import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/{api,cli}/specs/*.e2e-spec.ts'],
    globalSetup: ['src/setup.ts'],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
