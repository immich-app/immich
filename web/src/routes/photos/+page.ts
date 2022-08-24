import { redirect } from '@sveltejs/kit';
export const prerender = false;

import type { PageLoad } from '@sveltejs/kit';
import { setAssetInfo } from '$lib/stores/assets';

export const load: PageLoad = async ({ fetch, session }) => {
	if (!browser && !session.user) {
		throw redirect(302, '/auth/login');
	}

	try {
		const [userInfo, assets] = await Promise.all([
			fetch('/data/user/get-my-user-info').then((r) => r.json()),
			fetch('/data/asset/get-all-assets').then((r) => r.json())
		]);

		setAssetInfo(assets);

		return {
			user: userInfo
		};
	} catch (e) {
		console.log('ERROR load photos index');
		throw redirect(302, '/auth/login');
	}
};
