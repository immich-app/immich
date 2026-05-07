import { defineConfig, UserConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: { src: '/src' },
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      input: 'src/index.ts',
      output: {
        dir: 'dist',
      },
    },
    ssr: true,
  },
  ssr: {
    // bundle everything except for Node built-ins
    noExternal: /^(?!node:).*$/,
  },
  test: {
    name: 'cli:unit',
    globals: true,
  },
} as UserConfig);
