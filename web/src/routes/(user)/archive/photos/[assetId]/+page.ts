import { redirect } from '@sveltejs/kit';
export const prerender = false;
import type { PageLoad } from './$types';
import { AppRoute } from '$lib/constants';

export const load: PageLoad = async ({ parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	}

	throw redirect(302, AppRoute.ARCHIVE);
};
