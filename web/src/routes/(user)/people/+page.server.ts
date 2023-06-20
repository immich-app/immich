import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { AppRoute } from '$lib/constants';

export const load = (async ({ locals, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
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
