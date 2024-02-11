import { sveltekit } from '@sveltejs/kit/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import path from 'node:path';
import { splitVendorChunkPlugin } from 'vite';

const upstream = {
  target: process.env.IMMICH_SERVER_URL || 'http://immich-server:3001/',
  secure: true,
  changeOrigin: true,
  logLevel: 'info',
  ws: true,
};

export default defineConfig({
  build: {
    // largest chunk size is maplibre-gl
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // optimize chunks size https://github.com/vitejs/vite/discussions/9440
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      'xmlhttprequest-ssl': './node_modules/engine.io-client/lib/xmlhttprequest.js',
      // eslint-disable-next-line unicorn/prefer-module
      '@test-data': path.resolve(__dirname, './src/test-data'),
      '@api': path.resolve('./src/api'),
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
    visualizer({
      emitFile: true,
      filename: 'stats.html',
    }),
    splitVendorChunkPlugin(),
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
    alias: [{ find: /^svelte$/, replacement: 'svelte/internal' }],
  },
});
