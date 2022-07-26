import type { ExternalFetch, GetSession, Handle } from '@sveltejs/kit';
import * as cookie from 'cookie';
import { api } from '@api';

export const handle: Handle = async ({ event, resolve }) => {
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');

	if (!cookies['immich_is_authenticated']) {
		return await resolve(event);
	}

	try {
		const accessToken = cookies['immich_access_token'];

		api.setAccessToken(accessToken);

		const { data, status } = await api.userApi.getMyUserInfo();

		if (status === 200) {
			event.locals.user = {
				id: data.id,
				firstName: data.firstName,
				lastName: data.lastName,
				isAdmin: data.isAdmin,
				email: data.email
			};
		}

		const response = await resolve(event);

		return response;
	} catch (error) {
		return await resolve(event);
	}
};

export const getSession: GetSession = async ({ locals }) => {
	if (!locals.user) return {};

	return {
		user: {
			id: locals.user.id,
			firstName: locals.user.firstName,
			lastName: locals.user.lastName,
			isAdmin: locals.user.isAdmin,
			email: locals.user.email
		}
	};
};
