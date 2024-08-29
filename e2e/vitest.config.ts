import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/{api,cli,immich-admin}/specs/*.e2e-spec.ts'],
    globalSetup: ['src/setup/testcontainers.ts', 'src/setup/auth-server.ts'],
    testTimeout: 15_000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
