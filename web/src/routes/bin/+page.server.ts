import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { serverApi } from '@api';

export const load: PageServerLoad = async ({ parent }) => {
	try {
		const { user } = await parent();
		if (!user) {
			throw error(400, 'Not logged in');
		}

		const { data: assets } = await serverApi.recycleBinApi.getAllDeletedAssets();

		return {
			user,
			assets,
			meta: {
				title: 'Bin'
			}
		};
	} catch (e) {
		console.log('Bin page load error', e);
		throw redirect(302, '/auth/login');
	}
};
