import { redirect } from '@sveltejs/kit';
import { serverApi } from '@api';
// @ts-ignore
import type { PageServerLoad } from './$types';

// @ts-ignore
export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	} else if (!user.isAdmin) {
		throw redirect(302, '/photos');
	}

	const { data: allUsers } = await serverApi.userApi.getAllUsers(false);

	return { user, allUsers };
};
