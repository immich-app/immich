import adapter from '@sveltejs/adapter-static';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import dotenv from 'dotenv';
import { defaultTreeAdapter, parse, parseFragment, type DefaultTreeAdapterMap } from 'parse5';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type Plugin, type ProxyOptions, type UserConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

const buildDir = 'build';
const inlineTags = ['script', 'style'];
const shadowTemplatePackages = /\/node_modules\/(media-chrome|custom-media-element)\/dist\//;
const shadowTemplateModules = new Set<string>();
const pinInputStyle = '';

type ShadowTemplate = { getTemplateHTML: (attributes: Record<string, string>) => string };

const hasShadowTemplate = (value: unknown): value is ShadowTemplate =>
  typeof value === 'function' && 'getTemplateHTML' in value && typeof value.getTemplateHTML === 'function';

const cspManifest = (): Plugin => ({
  name: 'immich:csp-manifest',
  apply: 'build',
  generateBundle(_, bundle) {
    for (const chunk of Object.values(bundle)) {
      for (const id of chunk.type === 'chunk' ? chunk.moduleIds : []) {
        if (shadowTemplatePackages.test(id)) {
          shadowTemplateModules.add(id);
        }
      }
    }
  },
  buildApp: {
    order: 'post',
    async handler() {
      const indexHtml = path.join(buildDir, 'index.html');
      const hashes: Record<string, Set<string>> = Object.fromEntries(
        inlineTags.map((tag) => [`${tag}-src`, new Set()]),
      );
      const addHash = (tag: string, content: string) =>
        hashes[`${tag}-src`].add(`'sha256-${createHash('sha256').update(content).digest('base64')}'`);

      const walk = (node: DefaultTreeAdapterMap['node']) => {
        if (
          defaultTreeAdapter.isElementNode(node) &&
          inlineTags.includes(node.tagName) &&
          !node.attrs.some(({ name }) => name === 'src')
        ) {
          const [child] = node.childNodes;
          const content = child && defaultTreeAdapter.isTextNode(child) ? child.value : '';
          addHash(node.tagName, content);
        }

        if ('childNodes' in node) {
          for (const child of node.childNodes) {
            walk(child);
          }
        }
      };

      walk(parse(readFileSync(indexHtml, 'utf8')));
      addHash('style', pinInputStyle);

      for (const id of shadowTemplateModules) {
        for (const value of Object.values(await import(pathToFileURL(id).href))) {
          if (hasShadowTemplate(value)) {
            walk(parseFragment(value.getTemplateHTML({})));
          }
        }
      }

      const manifest = JSON.stringify(hashes, (_, value) => (value instanceof Set ? [...value] : value), 2);
      writeFileSync(path.join(buildDir, '.csp.json'), manifest + '\n');
    },
  },
});

const notFoundGetLine = /^404 (GET|HEAD) /;

const testing = (): Plugin => ({
  name: 'immich:test',
  apply: () => !!process.env.VITEST,
  configureServer: (server) => {
    const { logger } = server.config;
    const error = logger.error.bind(logger);
    logger.error = (message, options) => {
      if (isUnmockedMediaOrDownload(message)) {
        return;
      }

      error(message, options);
    };
  },
});

const isUnmockedMediaOrDownload = (message: string) => notFoundGetLine.test(stripVTControlCharacters(message));

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
    proxy: process.env.VITEST ? {} : proxy,
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
    testing(),

    process.env.BUILD_STATS === 'true'
      ? visualizer({
          emitFile: true,
          filename: 'stats.html',
        })
      : undefined,
  ],
  optimizeDeps: {
    entries: ['src/**/*.{svelte,ts,html}'],
  },
  test: {
    globals: true,
    sequence: {
      hooks: 'list',
    },
    env: {
      TZ: 'UTC',
    },
    server: {
      deps: {
        inline: ['@futo-org/backups-orchestrator-ui', '@material-symbols/svg-400'],
      },
    },
    name: 'web:unit',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./test/unit/setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ contextOptions: { timezoneId: 'UTC', locale: 'en-US' } }),
      instances: [{ browser: 'chromium' }],
    },
  },
} as UserConfig);
