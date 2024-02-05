import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'src/index.ts',
      output: {
        dir: 'dist',
      },
      external: ['@immich/sdk'],
    },
    ssr: true,
    commonjsOptions: {
      include: ['../open-api/', /node_modules/],
    },
  },
  optimizeDeps: {
    include: ['../open-api/'],
  },
  ssr: {
    // bundle everything except for Node built-ins
    noExternal: /^(?!node:).*$/,
  },
});
