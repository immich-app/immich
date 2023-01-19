import { env } from '$env/dynamic/public';
import { json } from '@sveltejs/kit';

const endpoint = env.PUBLIC_IMMICH_API_URL_EXTERNAL || '/api';

export const GET = async () => {
	return json({
		api: {
			endpoint
		}
	});
};
