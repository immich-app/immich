import { redirect } from '@sveltejs/kit';
export const prerender = false;

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	} else {
		throw redirect(302, '/photos');
	}
};
