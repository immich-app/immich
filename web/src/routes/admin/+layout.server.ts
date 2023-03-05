import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals: { user } }) => {
	if (!user) {
		throw redirect(302, '/auth/login');
	} else if (!user.isAdmin) {
		throw redirect(302, AppRoute.PHOTOS);
	}

	return { user };
}) satisfies LayoutServerLoad;
