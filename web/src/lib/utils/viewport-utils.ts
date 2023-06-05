/**
 * Glossary
 * 1. Section: Group of assets in a month
 */

import { api } from '@api';
import justifiedLayout from 'justified-layout';
import lodash from 'lodash-es';
import type { AssetBucket } from '$lib/models/asset-grid-state';

export async function calculateViewportLayout(
	userId: string | undefined,
	viewportWidth: number
): Promise<AssetBucket[]> {
	if (viewportWidth == 0) {
		return [];
	}

	const { data: assets } = await api.assetApi.getTimelineLayout({
		getTimelineLayoutDto: {
			userId,
			withoutThumbs: true
		}
	});

	const assetsGroupByMonth = lodash
		.chain(assets)
		.groupBy((a) => a.timeBucket)
		.sortBy((group) => assets.indexOf(group[0]))
		.value();

	return assetsGroupByMonth.map((group) => {
		const bucketHeight = justifiedLayout(
			group.map((a) => a.ratio),
			{
				boxSpacing: 2,
				containerWidth: Math.floor(viewportWidth),
				containerPadding: 0,
				targetRowHeightTolerance: 0.15,
				targetRowHeight: 235
			}
		).containerHeight;

		return {
			bucketDate: group[0].timeBucket,
			bucketHeight,
			assets: [],
			cancelToken: new AbortController()
		};
	});
}
