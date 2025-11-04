import type { TimelineAsset } from '$lib/managers/timeline-manager/types';

export const assetSnapshot = (asset: TimelineAsset): TimelineAsset => $state.snapshot(asset);
export const assetsSnapshot = (assets: TimelineAsset[]) => assets.map((asset) => $state.snapshot(asset));
