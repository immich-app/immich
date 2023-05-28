import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { OAuthConfigResponseDto } from '@api';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api } }) => {
	const { data } = await api.userApi.getUserCount({ admin: true });
	if (data.userCount === 0) {
		// Admin not registered
		throw redirect(302, AppRoute.AUTH_REGISTER);
	}

	let authConfig: OAuthConfigResponseDto = {
		passwordLoginEnabled: true,
		enabled: false
	};

	try {
		// TODO: Figure out how to get correct redirect URI server-side.
		const { data } = await api.oauthApi.generateConfig({ oAuthConfigDto: { redirectUri: '/' } });
		data.url = undefined;

		authConfig = data;
	} catch (err) {
		console.error('[ERROR] login/+page.server.ts:', err);
	}

	return {
		authConfig,
		meta: {
			title: 'Login'
		}
	};
}) satisfies PageServerLoad;
