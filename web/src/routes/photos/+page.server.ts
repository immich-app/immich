import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const { user } = await parent();
		if (!user) {
			throw error(400, 'Not logged in');
		}

		return {
			user,
			meta: {
				title: 'Photos'
			}
		};
	} catch (e) {
		console.log('Photo page load error', e);
		throw redirect(302, '/auth/login');
	}
};
