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
	server: {
		// connect to a remote backend during web-only development
		proxy: {
			'/api': {
				target: 'http://192.168.178.3:3001',
				secure: false,
				changeOrigin: true,
				logLevel: 'debug',
				rewrite: (path) => path.replace(/^\/api/, ''),
				ws: true
			}
		}
	},
	plugins: [sveltekit()]
};

export default config;
