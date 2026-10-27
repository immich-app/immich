import adapter from '@sveltejs/adapter-static';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import dotenv from 'dotenv';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type ProxyOptions, type UserConfig } from 'vite';

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
  '/.well-known/webauthn': upstream,
  '/custom.css': upstream,
};

dotenv.config({ quiet: true });
process.env.PUBLIC_IMMICH_BUY_HOST = process.env.PUBLIC_IMMICH_BUY_HOST || 'https://buy.immich.app';
process.env.PUBLIC_IMMICH_PAY_HOST = process.env.PUBLIC_IMMICH_PAY_HOST || 'https://pay.futo.org';

export default defineConfig({
  build: {
    target: 'es2022',
  },
  resolve: {
    alias: {
      'xmlhttprequest-ssl': './node_modules/engine.io-client/lib/xmlhttprequest.js',
    },
  },
  // '@immich/ui': path.resolve(import.meta.dirname, '../../ui/packages/ui'),
  server: {
    // connect to a remote backend during web-only development
    proxy,
    allowedHosts: true,
  },
  preview: {
    proxy,
  },
  plugins: [
    enhancedImages(),
    tailwindcss(),
    sveltekit({
      compilerOptions: {},
      // TODO pending `@immich/ui` to enable it
      // runes: true,
      preprocess: vitePreprocess(),

      version: {
        name: process.env.IMMICH_BUILD || process.env.npm_package_version || 'local',
      },
      paths: { relative: false },
      adapter: adapter({ fallback: 'index.html', precompress: true }),
      onwarn: (warning, handler) => {
        if (warning.code === 'state_referenced_locally') {
          return;
        }

        handler(warning);
      },
      // TODO remove as this way of doing it is deprecated
      alias: {
        'chromecast-caf-sender': './node_modules/@types/chromecast-caf-sender/index.d.ts',
      },
    }),

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
