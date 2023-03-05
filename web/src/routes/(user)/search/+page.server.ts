import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, parent, url }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const term = url.searchParams.get('q') || undefined;
	const { data: results } = await locals.api.searchApi.search(
		term,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		{ params: url.searchParams }
	);
	return { user, term, results };
}) satisfies PageServerLoad;
