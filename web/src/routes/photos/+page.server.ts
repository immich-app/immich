import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { serverApi, TimeGroupEnum } from '@api';

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const { user } = await parent();
		if (!user) {
			throw error(400, 'Not logged in');
		}

		const { data: assetCountByTimebucket } = await serverApi.assetApi.getAssetCountByTimeBucket({
			timeGroup: TimeGroupEnum.Month
		});

		return {
			user,
			assetCountByTimebucket
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
