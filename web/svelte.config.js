import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		adapter: adapter({ out: 'build' }),
		methodOverride: {
			allowed: ['PATCH', 'DELETE'],
		},
		vite: {
			resolve: {
				alias: {
					'xmlhttprequest-ssl': './node_modules/engine.io-client/lib/xmlhttprequest.js',
				},
			},
		},
	},
};

export default config;
