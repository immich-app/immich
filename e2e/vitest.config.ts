import { defineConfig } from 'vitest/config';

// skip `docker compose up` if `make e2e` was already run
const globalSetup: string[] = [];
try {
  await fetch('http://127.0.0.1:2283/api/server-info/ping');
} catch {
  globalSetup.push('src/setup.ts');
}

export default defineConfig({
  test: {
    include: ['src/{api,cli}/specs/*.e2e-spec.ts'],
    globalSetup,
    testTimeout: 10_000,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
