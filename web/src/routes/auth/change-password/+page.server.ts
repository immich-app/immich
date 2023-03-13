export const prerender = false;

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api } }) => {
	try {
		const { data: userInfo } = await api.userApi.getMyUserInfo();

		if (userInfo.shouldChangePassword) {
			return {
				user: userInfo,
				meta: {
					title: 'Change Password'
				}
			};
		} else {
			throw redirect(302, '/photos');
		}
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
}) satisfies PageServerLoad;
