import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { AppRoute } from '$lib/constants';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	} else if (!user.isAdmin) {
		throw redirect(302, AppRoute.PHOTOS);
	}

	throw redirect(302, AppRoute.ADMIN_USER_MANAGEMENT);
};
