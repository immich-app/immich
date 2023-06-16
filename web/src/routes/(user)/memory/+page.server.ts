import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { AppRoute } from '$lib/constants';

export const load = (async ({ locals: { user } }) => {
	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	}

	return {
		user,
		meta: {
			title: 'Memory'
		}
	};
}) satisfies PageServerLoad;
