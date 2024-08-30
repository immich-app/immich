import { defineConfig } from 'vitest/config';

// skip `docker compose up` if `make e2e` was already run
const globalSetup: string[] = ['src/setup/auth-server.ts'];
try {
  await fetch('http://127.0.0.1:2285/api/server-info/ping');
} catch {
  globalSetup.push('src/setup/docker-compose.ts');
}

export default defineConfig({
  test: {
    include: ['src/{api,cli,immich-admin}/specs/*.e2e-spec.ts'],
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
