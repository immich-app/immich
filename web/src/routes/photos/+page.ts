import { redirect } from '@sveltejs/kit';
export const prerender = false;

import type { PageLoad } from './$types';
import { setAssetInfo } from '$lib/stores/assets';
import { AssetResponseDto, UserResponseDto } from '@api';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const [userInfo, assets] = await Promise.all([
			fetch('/data/user/get-my-user-info').then((r) => r.json() as Promise<UserResponseDto>),
			fetch('/data/asset/get-all-assets').then((r) => r.json() as Promise<AssetResponseDto[]>)
		]);

		setAssetInfo(assets);

		return {
			user: userInfo
		};
	} catch (e) {
		console.log('ERROR load photos');
		throw redirect(302, '/auth/login');
	}
};
