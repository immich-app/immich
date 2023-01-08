export const prerender = false;
import { error } from '@sveltejs/kit';

import { AssetResponseDto, serverApi } from '@api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const assets: AssetResponseDto[] = [];
	const { key } = params;

	try {
		const { data: sharedLink } = await serverApi.shareApi.getSharedLinkByKey(key);
		if (sharedLink.expiresAt) {
			const now = new Date().getTime();
			const expiresAt = new Date(sharedLink.expiresAt).getTime();

			if (now > expiresAt) {
				throw error(400, {
					message: 'Expired link'
				});
			}
		}

		for (const assetId of sharedLink.assets) {
			const { data: asset } = await serverApi.assetApi.getAssetById(assetId, {
				params: {
					key
				}
			});
			assets.push(asset);
		}

		if (sharedLink.album) {
			const { data: album } = await serverApi.albumApi.getAlbumInfo(sharedLink.album.id, {
				params: {
					key
				}
			});
			sharedLink.album = album;
		}

		return { sharedLink, assets };
	} catch (e) {
		throw error(404, {
			message: 'Invalid shared link'
		});
	}
};
