import { redirect } from '@sveltejs/kit';
export const prerender = false;
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const { user } = await parent();
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		return {
			user
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
