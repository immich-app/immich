import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, locals: { api } }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	} else if (!user.isAdmin) {
		throw redirect(302, '/photos');
	}

	const { data: allUsers } = await api.userApi.getAllUsers({ isAll: false });

	return {
		user,
		allUsers,
		meta: {
			title: 'User Management'
		}
	};
}) satisfies PageServerLoad;
