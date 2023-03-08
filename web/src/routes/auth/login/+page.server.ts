import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api } }) => {
	const { data } = await api.userApi.getUserCount(true);
	if (data.userCount === 0) {
		// Admin not registered
		throw redirect(302, AppRoute.AUTH_REGISTER);
	}

	// TODO: Figure out how to get correct redirect URI server-side.
	const { data: authConfig } = await api.oauthApi.generateConfig({ redirectUri: '/' });
	authConfig.url = undefined;

	return {
		authConfig,
		meta: {
			title: 'Login'
		}
	};
}) satisfies PageServerLoad;
