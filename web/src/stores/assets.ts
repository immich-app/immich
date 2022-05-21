import { writable, derived } from 'svelte/store';
import { getRequest } from '$lib/api';
import type { ImmichAsset } from '../lib/models/immich-asset';


const assets = writable<ImmichAsset[]>([]);
const assetsGroupByDate = derived(assets, ($assets) => {
  return $assets.length + 20;
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