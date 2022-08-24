import { redirect } from '@sveltejs/kit';
export const prerender = false;

import type { PageLoad } from './$types';
import { setAssetInfo } from '$lib/stores/assets';
import { AssetResponseDto, UserResponseDto } from '@api';

export const load: PageLoad = async ({ fetch, parent }) => {
	try {
		const { user } = await parent();

		if (!user) {
			throw Error('User is not logged in');
		}

		const assets = await fetch('/data/asset/get-all-assets').then(
			(r) => r.json() as Promise<AssetResponseDto[]>
		);
		setAssetInfo(assets);

		return {
			user: user
		};
	} catch (e) {
		throw redirect(302, '/auth/login');
	}
};
