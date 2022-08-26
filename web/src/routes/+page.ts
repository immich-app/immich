export const prerender = false;
import { redirect } from '@sveltejs/kit';
import { api } from '@api';
import { browser } from '$app/env';
import type { PageLoad } from './$types';

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
