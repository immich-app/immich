import { redirect } from '@sveltejs/kit';
export const prerender = false;
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const personId = params['personId'];
	throw redirect(302, `/people/${personId}`);
};
