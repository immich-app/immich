import { adjustColors } from '@immich/image-editor';

export type ColorPreviewRequest = {
  src: string;
  width: number;
  height: number;
  brightness: number;
  contrast: number;
  pixels?: Uint8ClampedArray;
};

export type ColorPreviewResponse = { src: string; width: number; height: number; pixels: Uint8ClampedArray };

let source: Uint8ClampedArray | undefined;
addEventListener('message', ({ data }: MessageEvent<ColorPreviewRequest>) => {
  source = data.pixels ?? source;
  if (!source) {
    return;
  }
  const pixels = new Uint8ClampedArray(source);
  adjustColors(pixels, 4, data);
  const response: ColorPreviewResponse = { src: data.src, width: data.width, height: data.height, pixels };
  postMessage(response, { transfer: [pixels.buffer] });
});
