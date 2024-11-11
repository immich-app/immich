import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';

dotenv.config();

process.env.PUBLIC_IMMICH_BUY_HOST = process.env.PUBLIC_IMMICH_BUY_HOST || 'https://buy.immich.app';
process.env.PUBLIC_IMMICH_PAY_HOST = process.env.PUBLIC_IMMICH_PAY_HOST || 'https://pay.futo.org';

// We load the default media receiver app id if no custom one is provided as a build-time env variable
process.env.PUBLIC_IMMICH_CAST_APPLICATION_ID = process.env.PUBLIC_IMMICH_CAST_APPLICATION_ID || 'CC1AD845';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // TODO: migrate all enums to .ts files and remove `{script: true}` once
  preprocess: vitePreprocess({ script: true }),
  kit: {
    adapter: adapter({
      fallback: 'index.html',
      precompress: true,
    }),
    alias: {
      $lib: 'src/lib',
      '$lib/*': 'src/lib/*',
      '@test-data': 'src/test-data',
      $i18n: '../i18n',
      'chromecast-caf-sender': './node_modules/@types/chromecast-caf-sender/index.d.ts',
    },
  },
};

export default config;
