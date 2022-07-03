import { writable, derived } from 'svelte/store';
import { getRequest } from '$lib/api';
import type { ImmichAsset } from '$lib/models/immich-asset';
import lodash from 'lodash-es';
import _ from 'lodash';
import moment from 'moment';
export const assets = writable<ImmichAsset[]>([]);

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

export const getAssetsInfo = async (accessToken: string) => {
	const res = await getRequest('asset', accessToken);
	assets.set(res);
};
