import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
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
  enforce: 'post',
  closeBundle: {
    sequential: true,
    handler() {
      if (this.environment.name !== 'ssr') {
        return;
      }

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
  '/custom.css': upstream,
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
    enhancedImages(),
    tailwindcss(),
    sveltekit(),
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
