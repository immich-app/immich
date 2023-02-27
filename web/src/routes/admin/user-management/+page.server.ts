import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api } }) => {
	const { data: allUsers } = await api.userApi.getAllUsers(false);

	return {
		allUsers,
		meta: {
			title: 'User Management'
		}
	};
}) satisfies PageServerLoad;
