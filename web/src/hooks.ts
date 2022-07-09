import type { GetSession, Handle } from '@sveltejs/kit';
import * as cookie from 'cookie';
import { immichApi } from '$lib/immich-api';
import { AxiosError } from 'axios';

export const handle: Handle = async ({ event, resolve }) => {
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');

	if (!cookies.session) {
		return await resolve(event);
	}

	try {
		const { email, isAdmin, firstName, lastName, id, accessToken } = JSON.parse(cookies.session);

		immichApi.setAccessToken(accessToken);
		const { status } = await immichApi.authenticationApi.validateAccessToken();

		if (status === 201) {
			event.locals.user = {
				id,
				accessToken,
				firstName,
				lastName,
				isAdmin,
				email,
			};
		}

		const response = await resolve(event);

		return response;
	} catch (error) {
		if (error instanceof AxiosError) {
			console.log('Error validating token');
			return await resolve(event);
		}

		console.log('Error parsing session');
		return await resolve(event);
	}
};

export const getSession: GetSession = async ({ locals }) => {
	if (!locals.user) return {};

	return {
		user: {
			id: locals.user.id,
			accessToken: locals.user.accessToken,
			firstName: locals.user.firstName,
			lastName: locals.user.lastName,
			isAdmin: locals.user.isAdmin,
			email: locals.user.email,
		},
	};
};
