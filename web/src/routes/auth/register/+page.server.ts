import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { api } from '@api';

export const load: PageServerLoad = async () => {
	const { data } = await api.userApi.getUserCount(true);
	if (data.userCount != 0) {
		// Admin has been registered, redirect to login
		throw redirect(302, '/auth/login');
	}

	return {
		meta: {
			title: 'Admin Registration'
		}
	};
};
