import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess(),
  onwarn: (warning, handler) => {
    if (warning.code.includes('a11y')) {
      return;
    }
    handler(warning);
  },
  kit: {
    adapter: adapter({ out: 'build' }),
  },
};

export default config;
