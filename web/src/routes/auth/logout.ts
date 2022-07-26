import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async () => {
	return {
		headers: {
			'Set-Cookie': [
				'immich_is_authenticated=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;',
				'immich_access_token=delete; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
			]
		},
		body: {
			ok: true
		}
	};
};
