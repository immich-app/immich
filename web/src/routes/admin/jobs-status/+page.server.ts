import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { user, api } }) => {
	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	} else if (!user.isAdmin) {
		throw redirect(302, AppRoute.PHOTOS);
	}

	try {
		const { data: jobs } = await api.jobApi.getAllJobsStatus();

		return {
			jobs,
			meta: {
				title: 'Job Status'
			}
		};
	} catch (err) {
		console.error('[jobs] > getAllJobsStatus', err);
		throw err;
	}
}) satisfies PageServerLoad;
