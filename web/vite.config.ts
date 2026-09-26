import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type Plugin, type ProxyOptions, type UserConfig } from 'vite';
import path from 'node:path';

const upstream = {
  target: process.env.IMMICH_SERVER_URL || 'http://immich-server:2283/',
  secure: true,
  changeOrigin: true,
  logLevel: 'info',
  ws: true,
};

const proxy: Record<string, string | ProxyOptions> = {
  '/api': upstream,
  '/.well-known/immich': upstream,
  '/custom.css': upstream,
};

const castRequestLogger: Plugin = {
  name: 'cast-request-logger',
  apply: 'serve',
  configureServer(server) {
    if (process.env.CAST_LOG_REQUESTS !== 'true') {
      return;
    }

    server.middlewares.use((request, response, next) => {
      // Cast media URLs carry a sessionKey query parameter; keep it out of logs.
      const path = request.url?.split('?')[0] ?? '/';
      if (path !== '/api/sessions' && !path.startsWith('/api/assets/')) {
        next();
        return;
      }

      response.on('finish', () => {
        console.info('[Cast HTTP]', {
          method: request.method,
          path,
          status: response.statusCode,
          contentType: response.getHeader('content-type'),
          contentLength: response.getHeader('content-length'),
          resourcePolicy: response.getHeader('cross-origin-resource-policy'),
          allowOrigin: response.getHeader('access-control-allow-origin'),
          ip: request.headers['cf-connecting-ip'] ?? request.socket.remoteAddress,
          userAgent: request.headers['user-agent'],
        });
      });
      next();
    });
  },
};

export default defineConfig({
  build: {
    target: 'es2022',
  },
  resolve: {
    alias: {
      'xmlhttprequest-ssl': './node_modules/engine.io-client/lib/xmlhttprequest.js',
      // eslint-disable-next-line unicorn/prefer-module
      '@test-data': path.resolve(import.meta.dirname, './src/test-data'),
      // '@immich/ui': path.resolve(import.meta.dirname, '../../ui/packages/ui'),
    },
  },
  server: {
    // connect to a remote backend during web-only development
    proxy,
    allowedHosts: true,
  },
  preview: {
    proxy,
  },
  plugins: [
    castRequestLogger,
    enhancedImages(),
    tailwindcss(),
    sveltekit(),
    process.env.BUILD_STATS === 'true'
      ? visualizer({
          emitFile: true,
          filename: 'stats.html',
        })
      : undefined,
    svelteTesting(),
  ],
  optimizeDeps: {
    entries: ['src/**/*.{svelte,ts,html}'],
  },
  test: {
    name: 'web:unit',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test-data/setup.ts'],
    sequence: {
      hooks: 'list',
    },
    env: {
      TZ: 'UTC',
    },
  },
} as UserConfig);
