import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

/** @type {import('vite').UserConfig} */
const config = {
  resolve: {
    alias: {
      'xmlhttprequest-ssl': './node_modules/engine.io-client/lib/xmlhttprequest.js',
      '@api': path.resolve('./src/api'),
    },
  },
  server: {
    // connect to a remote backend during web-only development
    proxy: {
      '/api': {
        target: process.env.PUBLIC_IMMICH_SERVER_URL,
        secure: true,
        changeOrigin: true,
        logLevel: 'debug',
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true,
      },
    },
  },
  plugins: [sveltekit()],
  optimizeDeps: {
    entries: ['src/**/*.{svelte, ts, html}'],
  },
};

export default config;
