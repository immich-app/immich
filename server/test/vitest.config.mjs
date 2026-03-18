import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'server:unit',
    root: serverRoot,
    globals: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/cores/**', 'src/services/**', 'src/utils/**', 'src/sql-tools/**'],
      exclude: [
        'src/services/*.spec.ts',
        'src/services/api.service.ts',
        'src/services/microservices.service.ts',
        'src/services/index.ts',
      ],
    },
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
    env: {
      TZ: 'UTC',
    },
  },
});
