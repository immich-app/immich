export const prerender = false;
import { error } from '@sveltejs/kit';

import { getThumbnailUrl } from '$lib/utils/asset-utils';
import { serverApi, ThumbnailFormat } from '@api';
import type { PageServerLoad } from './$types';

export const ssr = true;

export const load: PageServerLoad = async ({ params }) => {
	const { key } = params;

	try {
		const { data: sharedLink } = await serverApi.shareApi.getMySharedLink({ params: { key } });

		const album = sharedLink?.album;
		const assetCount = sharedLink.assets.length;
		const url = `/share/${sharedLink.key}`;
		const title = (album ? album.albumName : 'Public Share') + ' - Immich';
		const description = sharedLink.description || `${assetCount} shared photos & videos.`;
		const assetId = album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;
		const imageUrl = assetId
			? getThumbnailUrl(assetId, ThumbnailFormat.Webp, sharedLink.key)
			: 'feature-panel.png';

		return {
			sharedLink,
			meta: {
				url,
				title,
				description,
				imageUrl
			}
		};
	} catch (e) {
		throw error(404, {
			message: 'Invalid shared link'
		});
	}
};
