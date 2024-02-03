import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'src/index.ts',
      output: {
        dir: 'dist',
      },
    },
  },
});
