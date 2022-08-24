import { json, RequestHandler } from '@sveltejs/kit';
import { serverApi } from '@api';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const isAll = url.searchParams.get('isAll') === 'true';

		const { data } = await serverApi.userApi.getAllUsers(isAll);
		return json(data);
	} catch {
		return new Response(undefined, { status: 500 });
	}
};
