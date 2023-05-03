import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { UserResponseDto } from '../../../api/open-api';

export const load = (async ({ locals: { api, user } }) => {
	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	}

	try {
		const { data: sharedAlbums } = await api.albumApi.getAllAlbums(true);
		const { data: partners } = await api.shareApi.getPartners();

		const allPartners: UserResponseDto[] = [];
		for (const partner of partners) {
			const { data: user } = await api.userApi.getUserById(partner.sharedBy);
			if (user) {
				allPartners.push(user);
			}
		}

		return {
			user,
			sharedAlbums,
			partners: allPartners,
			meta: {
				title: 'Sharing'
			}
		};
	} catch (e) {
		console.log(e);
		throw redirect(302, AppRoute.AUTH_LOGIN);
	}
}) satisfies PageServerLoad;
