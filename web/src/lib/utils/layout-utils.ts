import { getAssetRatio } from '$lib/utils/asset-utils';
import { TUNABLES } from '$lib/utils/tunables';
// note: it's important that this is not imported in more than one file due to https://github.com/sveltejs/kit/issues/7805
import { JustifiedLayout, type LayoutOptions } from '@immich/justified-layout-wasm';
import type { AssetResponseDto } from '@immich/sdk';
import createJustifiedLayout from 'justified-layout';

export type GetJustifiedLayout = typeof getJustifiedLayoutFromAssets;
type Geometry = ReturnType<typeof createJustifiedLayout>;
let useWasm = TUNABLES.LAYOUT.WASM;

export function setWasm(wasm: boolean) {
  useWasm = wasm;
}

export function getJustifiedLayoutFromAssets(assets: AssetResponseDto[], options: LayoutOptions) {
  if (useWasm) {
    return wasmJustifiedLayout(assets, options);
  }
  return justifiedLayout(assets, options);
}

function wasmJustifiedLayout(assets: AssetResponseDto[], options: LayoutOptions) {
  const aspectRatios = new Float32Array(assets.length);
  // eslint-disable-next-line unicorn/no-for-loop
  for (let i = 0; i < assets.length; i++) {
    const { width, height } = getAssetRatio(assets[i]);
    aspectRatios[i] = width / height;
  }
  return new JustifiedLayout(aspectRatios, options);
}

class Adapter {
  result: Geometry;
  constructor(result: Geometry) {
    this.result = result;
  }

  get containerWidth() {
    let width = 0;
    for (const box of this.result.boxes) {
      if (box.top < 100) {
        width = box.left + box.width;
      }
    }
    return width;
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
}

export function justifiedLayout(assets: AssetResponseDto[], options: LayoutOptions) {
  const adapter = {
    targetRowHeight: options.rowHeight,
    containerWidth: options.rowWidth,
    boxSpacing: options.spacing,
    targetRowHeightTolerange: options.heightTolerance,
  };

  const result = createJustifiedLayout(
    assets.map((g) => getAssetRatio(g)),
    adapter,
  );
  return new Adapter(result);
}
