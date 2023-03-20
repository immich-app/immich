import { error } from '@sveltejs/kit';
import { getThumbnailUrl } from '$lib/utils/asset-utils';
import { ThumbnailFormat } from '@api';
import type { PageServerLoad } from './$types';
import featurePanelUrl from '$lib/assets/feature-panel.png';

export const load = (async ({ params, locals: { api } }) => {
	const { key } = params;

	try {
		const { data: sharedLink } = await api.shareApi.getMySharedLink(key);

		const assetCount = sharedLink.assets.length;
		const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;

		return {
			sharedLink,
			meta: {
				title: sharedLink.album ? sharedLink.album.albumName : 'Public Share',
				description: sharedLink.description || `${assetCount} shared photos & videos.`,
				imageUrl: assetId
					? getThumbnailUrl(assetId, ThumbnailFormat.Webp, sharedLink.key)
					: featurePanelUrl
			}
		};
	} catch (e) {
		throw error(404, {
			message: 'Invalid shared link'
		});
	}
}) satisfies PageServerLoad;
