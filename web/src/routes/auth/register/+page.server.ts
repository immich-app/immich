import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api } }) => {
	const { data } = await api.userApi.getUserCount({ admin: true });
	if (data.userCount != 0) {
		// Admin has been registered, redirect to login
		throw redirect(302, '/auth/login');
	}

	return {
		meta: {
			title: 'Admin Registration'
		}
	};
}) satisfies PageServerLoad;
