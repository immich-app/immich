import { redirect } from '@sveltejs/kit';
export const prerender = false;
import type { PageLoad } from './$types';
import { AppRoute } from '$lib/constants';

export const load: PageLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	}

	const personId = params['personId'];
	throw redirect(302, `${AppRoute.PEOPLE}/${personId}`);
};
