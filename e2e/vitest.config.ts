import { defineConfig } from 'vitest/config';

const skipDockerSetup = process.env.VITEST_DISABLE_DOCKER_SETUP === 'true';

// skip `docker compose up` if `make e2e` was already run or if VITEST_DISABLE_DOCKER_SETUP is set
const globalSetup: string[] = [];
if (!skipDockerSetup) {
  try {
    await fetch('http://127.0.0.1:2285/api/server/ping');
  } catch {
    globalSetup.push('src/docker-compose.ts');
  }
}

export default defineConfig({
  test: {
    retry: process.env.CI ? 4 : 0,
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
