import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';
export const prerender = true;

import type { PageLoad } from './$types';
import { setAssetInfo } from '$lib/stores/assets';
import { AssetResponseDto } from '@api';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const assets = await fetch('/data/asset/get-all-assets').then(
		(r) => r.json() as Promise<AssetResponseDto[]>
	);

	setAssetInfo(assets);

	return {
		user
	};
};
