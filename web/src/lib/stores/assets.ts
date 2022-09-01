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

	const calculatedTimelineHeight = derived(assets, ($assets) => {
		return $assets.reduce((acc, cur) => {
			return acc + cur.segmentHeight;
		}, 0);
	});

	const calculateSegmentViewport = async (
		viewportWidth: number,
		assetCountByTimeGroup: AssetCountByTimeGroupResponseDto
	) => {
		const result: AssetStoreState[] = [];

		for (const segment of assetCountByTimeGroup.groups) {
			const unwrappedWidth = (3 / 2) * segment.count * 235 * (7 / 10);
			const rows = Math.ceil(unwrappedWidth / viewportWidth);
			const height = rows * 235;
			const assetStoreState = new AssetStoreState();

			assetStoreState.assets = [];
			assetStoreState.segmentHeight = height;
			assetStoreState.segmentDate = segment.timeGroup;

			result.push(assetStoreState);
		}

		assets.set(result);

		return result;
	};

	const getAssetsByTimeBuckets = async (timeBuckets: string[]) => {
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

		return assets;
	};

	const updateSegmentHeight = (segmentDate: string, height: number) => {
		assets.update((assets) => {
			const assetStoreState = assets.find((a) => a.segmentDate === segmentDate);
			if (assetStoreState) {
				assetStoreState.segmentHeight = height;
			}
			return assets;
		});
	};

	return {
		assets,
		calculateSegmentViewport,
		getAssetsByTimeBuckets,
		updateSegmentHeight,
		calculatedTimelineHeight
	};
}

export const assetStore = createAssetStore();
