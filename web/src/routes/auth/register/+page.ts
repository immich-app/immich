import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { api } from '@api';

export const load: PageLoad = async () => {
	const { data } = await api.userApi.getUserCount();
	if (data.userCount != 0) {
		// Admin has been registered, redirect to login
		throw redirect(302, '/auth/login');
	}

	return;
};
