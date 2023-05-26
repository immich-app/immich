import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { AppRoute } from '$lib/constants';

export const load: PageServerLoad = async ({ params, parent, locals: { api } }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, AppRoute.AUTH_LOGIN);
	}

	const { data: partner } = await api.userApi.getUserById({ userId: params['userId'] });

	return {
		user,
		partner,
		meta: {
			title: 'Partner'
		}
	};
};
