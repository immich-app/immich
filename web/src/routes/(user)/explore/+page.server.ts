import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const { data: items } = await locals.api.searchApi.getExploreData();

	return {
		user,
		items,
		meta: {
			title: 'Explore'
		}
	};
}) satisfies PageServerLoad;
