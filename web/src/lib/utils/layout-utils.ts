import { TUNABLES } from '$lib/utils/tunables';
import { JustifiedLayout, type LayoutOptions } from '@immich/justified-layout-wasm';

import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { getAssetRatio } from '$lib/utils/asset-utils';
import { isTimelineAsset, isTimelineAssets } from '$lib/utils/timeline-util';
import type { AssetResponseDto } from '@immich/sdk';
import createJustifiedLayout from 'justified-layout';

export type getJustifiedLayoutFromAssetsFunction = typeof getJustifiedLayoutFromAssets;

const useWasm = TUNABLES.LAYOUT.WASM;

export type CommonJustifiedLayout = {
  containerWidth: number;
  containerHeight: number;
  getTop(boxIdx: number): number;
  getLeft(boxIdx: number): number;
  getWidth(boxIdx: number): number;
  getHeight(boxIdx: number): number;
  getPosition(boxIdx: number): { top: number; left: number; width: number; height: number };
};

export type CommonLayoutOptions = {
  rowHeight: number;
  rowWidth: number;
  spacing: number;
  heightTolerance: number;
};

export function getJustifiedLayoutFromAssets(
  assets: TimelineAsset[] | AssetResponseDto[],
  options: CommonLayoutOptions,
): CommonJustifiedLayout {
  if (useWasm) {
    return isTimelineAssets(assets) ? wasmLayoutFromTimeline(assets, options) : wasmLayoutFromDto(assets, options);
  }
  return justifiedLayout(assets, options);
}

function wasmLayoutFromTimeline(assets: TimelineAsset[], options: LayoutOptions) {
  const aspectRatios = new Float32Array(assets.length);
  for (let i = 0; i < assets.length; i++) {
    aspectRatios[i] = assets[i].ratio;
  }
  return new JustifiedLayout(aspectRatios, options);
}

function wasmLayoutFromDto(assets: AssetResponseDto[], options: LayoutOptions) {
  const aspectRatios = new Float32Array(assets.length);
  for (let i = 0; i < assets.length; i++) {
    aspectRatios[i] = getAssetRatio(assets[i]) ?? 1;
  }
  return new JustifiedLayout(aspectRatios, options);
}

type Geometry = ReturnType<typeof createJustifiedLayout>;
class Adapter {
  result;
  width;
  constructor(result: Geometry) {
    this.result = result;
    this.width = 0;
    for (const box of this.result.boxes) {
      if (box.top === 0) {
        this.width = box.left + box.width;
      } else {
        break;
      }
    }
  }

  get containerWidth() {
    return this.width;
  }

  get containerHeight() {
    return this.result.containerHeight;
  }

  getTop(boxIdx: number) {
    return this.result.boxes[boxIdx]?.top;
  }

  getLeft(boxIdx: number) {
    return this.result.boxes[boxIdx]?.left;
  }

  getWidth(boxIdx: number) {
    return this.result.boxes[boxIdx]?.width;
  }

  getHeight(boxIdx: number) {
    return this.result.boxes[boxIdx]?.height;
  }

  getPosition(boxIdx: number) {
    const box = this.result.boxes[boxIdx];
    return { top: box.top, left: box.left, width: box.width, height: box.height };
  }
}

export function justifiedLayout(assets: (TimelineAsset | AssetResponseDto)[], options: CommonLayoutOptions) {
  const adapter = {
    targetRowHeight: options.rowHeight,
    containerWidth: options.rowWidth,
    boxSpacing: options.spacing,
    targetRowHeightTolerange: options.heightTolerance,
    containerPadding: 0,
  };

  const result = createJustifiedLayout(
    assets.map((asset) => (isTimelineAsset(asset) ? asset.ratio : (getAssetRatio(asset) ?? 1))),
    adapter,
  );
  return new Adapter(result);
}

export const emptyGeometry = () =>
  new Adapter({
    containerHeight: 0,
    widowCount: 0,
    boxes: [],
  });

export type CommonPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};
