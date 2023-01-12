import { json } from '@sveltejs/kit';
import { api } from '@api';

const endpoint = api.getBaseUrl();

export const prerender = true;
export const GET = async () => {
	return json({
		api: {
			endpoint
		}
	});
};
