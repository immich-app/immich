export const prerender = false;
import { serverApi } from '@api';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user) {
		throw redirect(302, '/photos');
	}

	const { data } = await serverApi.userApi.getUserCount(true);
	if (data.userCount > 0) {
		// Redirect to login page if an admin is already registered.
		throw redirect(302, '/auth/login');
	}

	return {
		meta: {
			title: 'Welcome 🎉',
			description: 'Immich Web Interface'
		}
	};
};
