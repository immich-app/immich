import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverApi } from '@api';

export const load: PageServerLoad = async () => {
	const { data } = await serverApi.userApi.getUserCount(true);
	if (data.userCount === 0) {
		// Admin not registered
		throw redirect(302, '/auth/register');
	}

	return {
		meta: {
			title: 'Login'
		}
	};
};
