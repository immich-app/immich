import { redirect } from '@sveltejs/kit';
export const prerender = false;

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	} else {
		throw redirect(302, '/memory');
	}
};
