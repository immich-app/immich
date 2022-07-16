import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

/** @type {import('vite').UserConfig} */
const config = {
	resolve: {
		alias: {
			'xmlhttprequest-ssl': './node_modules/engine.io-client/lib/xmlhttprequest.js',
			'@api': path.resolve('./src/api')
		}
	},
	plugins: [sveltekit()]
};

export default config;
