import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { calculateTimeLineTotalHeight, serverApi, TimeGroupEnum } from '@api';

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const { user } = await parent();
		if (!user) {
			throw error(400, 'Not logged in');
		}

		const { data: assetCountByTimeGroup } = await serverApi.assetApi.getAssetCountByTimeGroup({
			timeGroup: TimeGroupEnum.Month
		});

		return {
			user,
			assetCountByTimeGroup
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
