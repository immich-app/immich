import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const upstream = {
  target: process.env.IMMICH_SERVER_URL || 'http://immich-server:2283/',
  secure: true,
  changeOrigin: true,
  logLevel: 'info',
  ws: true,
};

export default defineConfig({
  resolve: {
    alias: {
      'xmlhttprequest-ssl': './node_modules/engine.io-client/lib/xmlhttprequest.js',
      // eslint-disable-next-line unicorn/prefer-module
      '@test-data': path.resolve(__dirname, './src/test-data'),
      'chromecast-caf-sender': path.resolve(__dirname, 'node_modules/@types/chromecast-caf-sender/index.d.ts'),
    },
  },
  server: {
    // connect to a remote backend during web-only development
    proxy: {
      '/api': upstream,
      '/.well-known/immich': upstream,
      '/custom.css': upstream,
    },
  },
  plugins: [
    sveltekit(),
    process.env.BUILD_STATS === 'true'
      ? visualizer({
          emitFile: true,
          filename: 'stats.html',
        })
      : undefined,
    enhancedImages(),
    svelteTesting(),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    entries: ['src/**/*.{svelte,ts,html}'],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-data/setup.ts'],
    sequence: {
      hooks: 'list',
    },
  },
});
