import type { TimelineAsset } from './types';

export const assetSnapshot = (asset: TimelineAsset): TimelineAsset => $state.snapshot(asset);
export const assetsSnapshot = (assets: TimelineAsset[]) => assets.map((asset) => $state.snapshot(asset));

export function filterRenderable<T extends { renderable: boolean }>(items: T[]) {
  return items.filter(({ renderable }) => renderable);
}
