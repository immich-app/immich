import { writable, derived } from 'svelte/store';
import { getRequest } from '$lib/api';
import type { ImmichAsset } from '$lib/models/immich-asset'
import * as _ from 'lodash';
import moment from 'moment';

const assets = writable<ImmichAsset[]>([]);

const assetsGroupByDate = derived(assets, ($assets) => {

  return _.chain($assets)
    .groupBy((a) => moment(a.createdAt).format('ddd, MMM DD'))
    .sortBy((group) => $assets.indexOf(group[0]))
    .value();

})

const getAssetsInfo = async (accessToken: string) => {
  const res = await getRequest('asset', accessToken);

  assets.set(res);
}

export default {
  assets,
  assetsGroupByDate,
  getAssetsInfo,
}