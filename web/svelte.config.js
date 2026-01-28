import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';

dotenv.config();

process.env.PUBLIC_IMMICH_BUY_HOST = process.env.PUBLIC_IMMICH_BUY_HOST || 'https://buy.immich.app';
process.env.PUBLIC_IMMICH_PAY_HOST = process.env.PUBLIC_IMMICH_PAY_HOST || 'https://pay.futo.org';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // TODO pending `@immich/ui` to enable it
    // runes: true,
  },
  preprocess: vitePreprocess(),
  kit: {
    paths: {
      relative: false,
    },
    adapter: adapter({
      fallback: 'index.html',
      precompress: true,
    }),
    alias: {
      $lib: 'src/lib',
      '$lib/*': 'src/lib/*',
      $tests: 'src/../tests',
      '$tests/*': 'src/../tests/*',
      '@test-data': 'src/test-data',
      $i18n: '../i18n',
      'chromecast-caf-sender': './node_modules/@types/chromecast-caf-sender/index.d.ts',
    },
    csp: {
      directives: {
        'default-src': ['self'],
        'connect-src': ['self', 'blob:', 'https://*.immich.cloud', 'https://*.maptiler.com'], // TODO: check if custom maptiler json works
        'img-src': ['self', 'blob:', 'data:'],
        'script-src': ['self', 'wasm-unsafe-eval', 'https://*.gstatic.com'],
        'worker-src': ['self', 'blob:'],
      },
    },
  },
};

export default config;
