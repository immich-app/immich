import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ parent }) => {
	const { user } = await parent();

	// Auth guard for admin routes.
	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	} else if (!user.isAdmin) {
		throw redirect(302, AppRoute.PHOTOS);
	}

	return { user };
}) satisfies LayoutLoad;
