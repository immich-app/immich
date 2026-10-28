import adapter from '@sveltejs/adapter-static';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import dotenv from 'dotenv';
import { defaultTreeAdapter, parse, type DefaultTreeAdapterMap } from 'parse5';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type Plugin, type ProxyOptions, type UserConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const buildDir = 'build';
const inlineTags = ['script', 'style'];

const cspManifest = (): Plugin => ({
  name: 'immich:csp-manifest',
  apply: 'build',
  buildApp: {
    order: 'post',
    async handler() {
      const indexHtml = path.join(buildDir, 'index.html');
      const hashes: Record<string, string[]> = Object.fromEntries(inlineTags.map((tag) => [`${tag}-src`, []]));

      const walk = (node: DefaultTreeAdapterMap['node']) => {
        if (
          defaultTreeAdapter.isElementNode(node) &&
          inlineTags.includes(node.tagName) &&
          !node.attrs.some(({ name }) => name === 'src')
        ) {
          const [child] = node.childNodes;
          const content = child && defaultTreeAdapter.isTextNode(child) ? child.value : '';
          hashes[`${node.tagName}-src`].push(`'sha256-${createHash('sha256').update(content).digest('base64')}'`);
        }

        if ('childNodes' in node) {
          for (const child of node.childNodes) {
            walk(child);
          }
        }
      };

      walk(parse(readFileSync(indexHtml, 'utf8')));

      writeFileSync(path.join(buildDir, '.csp.json'), JSON.stringify(hashes, undefined, 2) + '\n');
    },
  },
});

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
    cspManifest(),

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
