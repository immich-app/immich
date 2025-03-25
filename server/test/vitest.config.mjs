import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Set the timezone to UTC to avoid timezone issues during testing
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    root: './',
    globals: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/cores/**', 'src/interfaces/**', 'src/services/**', 'src/utils/**'],
      exclude: [
        'src/services/*.spec.ts',
        'src/services/api.service.ts',
        'src/services/microservices.service.ts',
        'src/services/index.ts',
      ],
      thresholds: {
        lines: 85,
        statements: 85,
        branches: 90,
        functions: 85,
      },
    },
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
  },
  plugins: [swc.vite(), tsconfigPaths()],
});
