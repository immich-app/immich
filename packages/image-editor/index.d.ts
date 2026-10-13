export type ColorAdjustment = { brightness: number; contrast: number };
export function getColorAdjustment(parameters: ColorAdjustment): {
  gain: number;
  slope: number;
  offset: number;
};
/** Adjust float linear RGB/scRGB in place, without clipping. Alpha is normalized and preserved. */
export function adjustLinearColors(
  data: Float32Array | Float64Array,
  channels: number,
  parameters: ColorAdjustment,
): void;
/** Final encoding to 8-bit sRGB. Float alpha is normalized 0..1. */
export function encodeLinearColors(
  data: Float32Array | Float64Array,
  channels: number,
): Uint8Array;
/** Browser adapter for interleaved 8-bit sRGB pixels. Alpha is preserved. */
export function adjustColors(
  data: Uint8Array | Uint8ClampedArray,
  channels: number,
  parameters: ColorAdjustment,
): void;
