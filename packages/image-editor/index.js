// Oklab lightness adjustment shared by the float scRGB server pipeline and browser preview.
// Matrices: Björn Ottosson's Oklab definition, https://bottosson.github.io/posts/oklab/.
const decode = Float32Array.from({ length: 256 }, (_, i) => {
  const value = i / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
});

/** @param {number} length @param {number} channels */
function validateLayout(length, channels) {
  if ((channels !== 3 && channels !== 4) || length % channels !== 0) {
    throw new RangeError('Color adjustment requires RGB or RGBA pixels');
  }
}

/**
 * Brightness is a linear-light RGB gain. By Oklab's scale invariance it scales L/a/b by its cube root.
 * Contrast scales only lightness about L=0.5; chroma is untouched by contrast.
 * @param {{ brightness: number, contrast: number }} parameters
 */
export function getColorAdjustment({ brightness, contrast }) {
  if (
    ![brightness, contrast].every(
      (value) => Number.isFinite(value) && value >= -100 && value <= 100,
    )
  ) {
    throw new RangeError(
      'Color adjustments must be finite and between -100 and 100',
    );
  }
  const gain = Math.cbrt(1 + brightness / 100);
  const slope = 1 + contrast / 100;
  return { gain, slope, offset: 0.5 * (1 - slope) };
}

/**
 * Adjust float linear sRGB/scRGB in place. RGB can extend outside 0..1; alpha is normalized 0..1.
 * No clipping, gamut conversion or quantization occurs here.
 * @param {Float32Array | Float64Array} data
 * @param {number} channels
 * @param {{ brightness: number, contrast: number }} parameters
 */
export function adjustLinearColors(data, channels, parameters) {
  validateLayout(data.length, channels);
  const { gain, slope, offset } = getColorAdjustment(parameters);
  if (parameters.brightness === 0 && parameters.contrast === 0) {
    return;
  }
  // Brightness alone needs no perceptual round trip, so it also preserves exact RGB ratios.
  if (parameters.contrast === 0) {
    const brightness = 1 + parameters.brightness / 100;
    for (let i = 0; i < data.length; i += channels) {
      data[i] *= brightness;
      data[i + 1] *= brightness;
      data[i + 2] *= brightness;
    }
    return;
  }
  for (let i = 0; i < data.length; i += channels) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const l = Math.cbrt(
      0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue,
    );
    const m = Math.cbrt(
      0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue,
    );
    const s = Math.cbrt(
      0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue,
    );
    const lightness =
      (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s) * gain * slope +
      offset;
    const a = (1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s) * gain;
    const b = (0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s) * gain;
    const lo = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const mo = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const so = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
    data[i] = 4.0767416621 * lo - 3.3077115913 * mo + 0.2309699292 * so;
    data[i + 1] = -1.2684380046 * lo + 2.6097574011 * mo - 0.3413193965 * so;
    data[i + 2] = -0.0041960863 * lo - 0.7034186147 * mo + 1.707614701 * so;
  }
}

// Final transfer curve only; the float working pixels never pass through this table until output.
const ENCODE_SIZE = 4096;
const encodeTable = Float64Array.from({ length: ENCODE_SIZE + 1 }, (_, i) => {
  const value = i / ENCODE_SIZE;
  return (
    (value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055) *
    255
  );
});

/** @param {number} value */
function encode(value) {
  const position = Math.min(1, Math.max(0, value)) * ENCODE_SIZE;
  const index = Math.min(ENCODE_SIZE - 1, Math.floor(position));
  return Math.round(
    encodeTable[index] +
      (encodeTable[index + 1] - encodeTable[index]) * (position - index),
  );
}

/**
 * Final output boundary: encode float linear RGB into 8-bit sRGB, preserving normalized alpha.
 * @param {Float32Array | Float64Array} data
 * @param {number} channels
 */
export function encodeLinearColors(data, channels) {
  validateLayout(data.length, channels);
  const output = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += channels) {
    output[i] = encode(data[i]);
    output[i + 1] = encode(data[i + 1]);
    output[i + 2] = encode(data[i + 2]);
    if (channels === 4) {
      output[i + 3] = Math.round(Math.min(1, Math.max(0, data[i + 3])) * 255);
    }
  }
  return output;
}

/**
 * Browser adapter: decode sRGB once, run the shared float adjustment, encode only the final result.
 * @param {Uint8Array | Uint8ClampedArray} data
 * @param {number} channels
 * @param {{ brightness: number, contrast: number }} parameters
 */
export function adjustColors(data, channels, parameters) {
  validateLayout(data.length, channels);
  getColorAdjustment(parameters);
  if (parameters.brightness === 0 && parameters.contrast === 0) {
    return;
  }
  const pixels = new Float32Array(data.length);
  for (let i = 0; i < data.length; i += channels) {
    pixels[i] = decode[data[i]];
    pixels[i + 1] = decode[data[i + 1]];
    pixels[i + 2] = decode[data[i + 2]];
    if (channels === 4) {
      pixels[i + 3] = data[i + 3] / 255;
    }
  }
  adjustLinearColors(pixels, channels, parameters);
  data.set(encodeLinearColors(pixels, channels));
}
