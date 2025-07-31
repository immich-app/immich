// import { TUNABLES } from '$lib/utils/tunables';
// note: it's important that this is not imported in more than one file due to https://github.com/sveltejs/kit/issues/7805
// import { JustifiedLayout, type LayoutOptions } from '@immich/justified-layout-wasm';

import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { getAssetRatio } from '$lib/utils/asset-utils';
import { JustifiedLayout as JustifiedLayoutJs } from '$lib/utils/justified-layout';
import { isTimelineAsset } from '$lib/utils/timeline-util';
import type { AssetResponseDto } from '@immich/sdk';

export type getJustifiedLayoutFromAssetsFunction = typeof getJustifiedLayoutFromAssets;

// let useWasm = TUNABLES.LAYOUT.WASM;

export type CommonJustifiedLayout = {
  containerWidth: number;
  containerHeight: number;
  getTop(boxIdx: number): number;
  getLeft(boxIdx: number): number;
  getWidth(boxIdx: number): number;
  getHeight(boxIdx: number): number;
};

export type CommonLayoutOptions = {
  rowHeight: number;
  rowWidth: number;
  spacing: number;
  heightTolerance: number;
};

export function getJustifiedLayoutFromAssets(
  assets: (TimelineAsset | AssetResponseDto)[],
  options: CommonLayoutOptions,
): CommonJustifiedLayout {
  // if (useWasm) {
  //   return wasmJustifiedLayout(assets, options);
  // }
  return justifiedLayout(assets, options);
}

// commented out until a solution for top level awaits on safari is fixed
// function wasmJustifiedLayout(assets: (TimelineAsset | AssetResponseDto)[], options: LayoutOptions) {
//   const aspectRatios = new Float32Array(assets.length);
//   // eslint-disable-next-line unicorn/no-for-loop
//   for (let i = 0; i < assets.length; i++) {
//     if (isTimelineAsset(assets[i])) {
//       aspectRatios[i] = assets[i].ratio;
//     } else {
//       const { width, height } = getAssetRatio(assets[i]);
//       aspectRatios[i] = width / height;
//     }
//   }
//   return new JustifiedLayout(aspectRatios, options);
// }

export function justifiedLayout(assets: (TimelineAsset | AssetResponseDto)[], options: CommonLayoutOptions) {
  return new JustifiedLayoutJs(
    assets.map((asset) => {
      if (isTimelineAsset(asset)) {
        return asset.ratio;
      }
      const { width, height } = getAssetRatio(asset);
      return width / height;
    }),
    options,
  );
}

export type CommonPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function getPosition(geometry: CommonJustifiedLayout, boxIdx: number): CommonPosition {
  const top = geometry.getTop(boxIdx);
  const left = geometry.getLeft(boxIdx);
  const width = geometry.getWidth(boxIdx);
  const height = geometry.getHeight(boxIdx);

  return { top, left, width, height };
}
