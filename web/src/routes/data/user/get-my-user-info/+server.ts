import { json, RequestHandler } from '@sveltejs/kit';
import { serverApi } from '@api';

export const GET: RequestHandler = async () => {
	try {
		const { data } = await serverApi.userApi.getMyUserInfo();
		return json(data);
	} catch {
		return new Response(undefined, { status: 500 });
	}
};
