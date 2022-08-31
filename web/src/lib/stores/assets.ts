import { writable, derived, readable } from 'svelte/store';
import lodash from 'lodash-es';
import _ from 'lodash';
import moment from 'moment';
import { api, AssetCountByTimeGroupResponseDto, AssetResponseDto } from '@api';
import { AssetStoreState } from '$lib/models/asset-store-state';

export const assets = writable<AssetResponseDto[]>([]);

export const assetsGroupByDate = derived(assets, ($assets) => {
	try {
		return lodash
			.chain($assets)
			.groupBy((a) => moment(a.createdAt).format('ddd, MMM DD YYYY'))
			.sortBy((group) => $assets.indexOf(group[0]))
			.value();
	} catch (e) {
		return [];
	}
});

export const flattenAssetGroupByDate = derived(assetsGroupByDate, ($assetsGroupByDate) => {
	return $assetsGroupByDate.flat();
});

export const getAssetsInfo = async () => {
	try {
		const { data } = await api.assetApi.getAllAssets();
	} catch (error) {
		console.log('Error [getAssetsInfo]');
	}
};

export const setAssetInfo = (data: AssetResponseDto[]) => {
	assets.set(data);
};

function createAssetStore() {
	const assets = writable<AssetStoreState[]>([]);

	function calculateSegmentViewport(
		viewportWidth: number,
		assetCountByTimeGroup: AssetCountByTimeGroupResponseDto
	) {
		for (const segment of assetCountByTimeGroup.groups) {
			const unwrappedWidth = (3 / 2) * segment.count * 235 * (7 / 10);
			const rows = Math.ceil(unwrappedWidth / viewportWidth);
			const height = rows * 235;

			const assetStoreState = new AssetStoreState();

			assetStoreState.assets = [];
			assetStoreState.assetsGroupByDate = [];
			assetStoreState.segmentHeight = height;
			assetStoreState.segmentDate = segment.timeGroup;

			assets.update((assets) => {
				assets = [...assets, assetStoreState];
				return assets;
			});
		}
	}

	async function getAssetsAndUpdateSegmentHeight(timeBuckets: string[]) {
		for (const timeBucket of timeBuckets) {
			const { data: assetResponseDto } = await api.assetApi.getAssetByTimeBucket({
				timeBucket: [timeBucket]
			});

			assets.update((assets) => {
				const assetStoreState = assets.find((a) => a.segmentDate === timeBucket);
				if (assetStoreState) {
					assetStoreState.assets = assetResponseDto;
				}
				return assets;
			});
		}
		// calculateSegmentViewport(window.innerWidth, data);
	}
	return {
		assets,
		calculateSegmentViewport,
		getAssetsAndUpdateSegmentHeight
	};
}

export const assetStore = createAssetStore();
