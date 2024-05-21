import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    prerender: {
      entries: [],
      handleHttpError: 'warn',
    },
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
    }),
    alias: {
      $lib: 'src/lib',
      '$lib/*': 'src/lib/*',
      '@test-data': 'src/test-data',
    },
  },
};

export default config;
