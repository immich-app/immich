import { defineConfig } from 'vitest/config';

// skip `docker compose up` if `make e2e` was already run
const globalSetup: string[] = [];
try {
  await fetch('http://127.0.0.1:2285/api/server/ping');
} catch {
  globalSetup.push('src/docker-compose.ts');
}

export default defineConfig({
  test: {
    include: ['src/specs/server/**/*.e2e-spec.ts'],
    globalSetup,
    testTimeout: 15_000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
