import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';
import path from 'path';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		adapter: adapter({ out: 'build' }),
		methodOverride: {
			allowed: ['PATCH', 'DELETE']
		}
	}
};

export default config;
