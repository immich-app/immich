import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const { data: people } = await locals.api.personApi.getAllPeople();

	return {
		user,
		people,
		meta: {
			title: 'People'
		}
	};
}) satisfies PageServerLoad;
