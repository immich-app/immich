import { TUNABLES } from '$lib/utils/tunables';

import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { getAssetRatio } from '$lib/utils/asset-utils';
import { isTimelineAsset, isTimelineAssets } from '$lib/utils/timeline-util';
import { JustifiedLayout, type LayoutOptions } from '@immich/justified-layout-wasm';
import type { AssetResponseDto } from '@immich/sdk';
import createJustifiedLayout from 'justified-layout';

const useWasm = TUNABLES.LAYOUT.WASM;

export type CommonJustifiedLayout = {
  containerWidth: number;
  containerHeight: number;
  getTop(boxIdx: number): number;
  getLeft(boxIdx: number): number;
  getWidth(boxIdx: number): number;
  getHeight(boxIdx: number): number;
  getPosition(boxIdx: number): {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

export type CommonLayoutOptions = {
  rowHeight: number;
  rowWidth: number;
  spacing: number;
  heightTolerance: number;
};

export function getJustifiedLayoutFromAssets(
  assets: AssetResponseDto[] | TimelineAsset[],
  options: CommonLayoutOptions,
) {
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
    const { width, height } = getAssetRatio(assets[i]);
    aspectRatios[i] = width / height;
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
      if (box.top < 100) {
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

  getPosition(boxIdx: number): CommonPosition {
    return this.result.boxes[boxIdx];
  }
}

export function justifiedLayout(assets: TimelineAsset[] | AssetResponseDto[], options: CommonLayoutOptions) {
  const adapter = {
    targetRowHeight: options.rowHeight,
    containerWidth: options.rowWidth,
    boxSpacing: options.spacing,
    targetRowHeightTolerange: options.heightTolerance,
  };

  const result = createJustifiedLayout(
    assets.map((asset) => (isTimelineAsset(asset) ? asset.ratio : getAssetRatio(asset))),
    adapter,
  );
  return new Adapter(result);
}

export type CommonPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type PageLayoutOptions = {
  assets: TimelineAsset[] | AssetResponseDto[];
  geometry: CommonJustifiedLayout | null;
  pageHeaderOffset: number;
  slidingTop: number;
  slidingBottom: number;
};

export function getPageLayout({ assets, geometry, pageHeaderOffset, slidingBottom, slidingTop }: PageLayoutOptions) {
  if (!geometry) {
    return {
      assetLayout: [],
      containerHeight: 0,
      containerWidth: 0,
    };
  }

  const assetLayout = [];
  for (let i = 0; i < assets.length; i++) {
    const { top, left, width, height } = geometry.getPosition(i);

    const layoutTopWithOffset = top + pageHeaderOffset;
    const display = layoutTopWithOffset < slidingBottom && layoutTopWithOffset + height > slidingTop;

    const layout = {
      asset: assets[i],
      top,
      left,
      width,
      height,
      display,
    };

    assetLayout.push(layout);
  }

  return {
    assetLayout,
    containerHeight: geometry.containerHeight,
    containerWidth: geometry.containerWidth,
  };
}
