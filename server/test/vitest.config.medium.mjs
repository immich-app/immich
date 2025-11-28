import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.{js,ts}', 'test/medium/**/*.spec.ts'],
    globalSetup: ['test/medium/globalSetup.ts'],
    deps: {
      fallbackCJS: true,
    },
  },
  plugins: [swc.vite(), tsconfigPaths({ configNames: ['tsconfig.json'] })],
});
