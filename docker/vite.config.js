import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      lib: resolve('lib'),
      src: resolve('src'),
      test: resolve('test'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      name: 'immich-docker',
      // the proper extensions will be added
      fileName: 'immich-docker',
    },
  },
});
