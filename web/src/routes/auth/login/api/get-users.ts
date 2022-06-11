import type { RequestHandler } from '@sveltejs/kit';
import { getRequest } from '../../../../lib/api';

export const get: RequestHandler = async ({ request, locals }) => {
	const allUsers = await getRequest('user?isAll=true', locals.user!.accessToken);

	return {
		status: 200,
		body: { allUsers },
	};
};
