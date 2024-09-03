import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/cores/**', 'src/interfaces/**', 'src/services/**', 'src/utils/**'],
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 85,
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
