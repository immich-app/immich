import type { ExternalFetch, GetSession, Handle } from '@sveltejs/kit';
import * as cookie from 'cookie';
import { api } from '@api';

export const handle: Handle = async ({ event, resolve }) => {
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');

	if (!cookies['immich_is_authenticated']) {
		return await resolve(event);
	}
	const accessToken = cookies['immich_access_token'];

	try {
		api.setAccessToken(accessToken);
		const { data } = await api.userApi.getMyUserInfo();
		event.locals.user = data;

		return await resolve(event);
	} catch (error) {
		event.locals.user = undefined;
		return await resolve(event);
	}
};

export const getSession: GetSession = async ({ locals }) => {
	if (!locals.user) return {};

	return {
		user: locals.user
	};
};
