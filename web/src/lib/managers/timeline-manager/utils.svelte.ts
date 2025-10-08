import type { Asset } from './types';

export const assetSnapshot = (asset: Asset): Asset => $state.snapshot(asset);
export const assetsSnapshot = (assets: Asset[]) => assets.map((asset) => $state.snapshot(asset));
