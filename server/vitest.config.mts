import path from 'node:path';
import 'reflect-metadata';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        baseUrl: path.resolve('./'),
        paths: {
          '@test': ['test'],
          '@test/*': ['test/*'],
          '@app/immich': ['src/immich'],
          '@app/immich/*': ['src/immich/*'],
          '@app/infra': ['src/infra'],
          '@app/infra/*': ['src/infra/*'],
          '@app/domain': ['src/domain'],
          '@app/domain/*': ['src/domain/*'],
        },
      },
    }),
  ],
});
