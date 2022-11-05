import { redirect } from '@sveltejs/kit';
import { serverApi } from '@api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	} else if (!user.isAdmin) {
		throw redirect(302, '/photos');
	}

	const allUsers = serverApi.userApi.getAllUsers(false);
	const settings = serverApi.configApi.getSystemConfig();

	const { data: allUsersData } = await allUsers;
	const { data: settingsData } = await settings;

	return {
		user: user,
		allUsers: allUsersData,
		settings: settingsData
	};
};
