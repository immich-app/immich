import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api, user } }) => {
	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	}

	try {
		const { data: sharedAlbums } = await api.albumApi.getAllAlbums({ shared: true });
		const { data: partners } = await api.partnerApi.getPartners({ direction: 'shared-with' });

		return {
			user,
			sharedAlbums,
			partners,
			meta: {
				title: 'Sharing'
			}
		};
	} catch (e) {
		console.log(e);
		throw redirect(302, AppRoute.AUTH_LOGIN);
	}
}) satisfies PageServerLoad;
