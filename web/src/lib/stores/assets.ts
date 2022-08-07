import { writable, derived } from 'svelte/store';
import lodash from 'lodash-es';
import _ from 'lodash';
import moment from 'moment';
import { api, AssetResponseDto } from '@api';
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
		assets.set(data);
	} catch (error) {
		console.log('Error [getAssetsInfo]');
	}
};

export const setAssetInfo = (data: AssetResponseDto[]) => {
	assets.set(data);
};
