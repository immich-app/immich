import { api } from '@api';
import { redirect } from '@sveltejs/kit';
export const prerender = false;

import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
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
};
