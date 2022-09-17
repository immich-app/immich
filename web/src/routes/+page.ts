export const prerender = false;
import { redirect } from '@sveltejs/kit';
import { api } from '@api';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';

export const load: PageLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user) {
		throw redirect(302, '/photos');
	}

	if (browser) {
		const { data } = await api.userApi.getUserCount();

		return {
			isAdminUserExist: data.userCount != 0
		};
	}
};
