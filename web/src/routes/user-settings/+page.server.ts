import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const { user } = await parent();

		if (!user) {
			throw Error('User is not logged in');
		}

		return {
			user: user
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
