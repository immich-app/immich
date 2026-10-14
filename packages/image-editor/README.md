# Image editor color adjustments

Shared, dependency-free Oklab processing for the browser preview worker and server thumbnails/exports.

The server resamples in floating-point linear sRGB/scRGB using Sharp, reads float samples, applies the
shared adjustment, and encodes to 8-bit sRGB only at the final output boundary. Negative values,
highlight overshoot, and fractional samples survive until then. There is no intermediate sRGB byte
buffer. Sharp's current `linear()` casts Oklab samples to bytes, so the adjustment uses the shared
float implementation rather than that operation.

Brightness is a linear-light RGB gain `1 + brightness / 100`. Contrast changes only Oklab lightness:
`L' = (1 + contrast / 100) * L + 0.5 * (1 - (1 + contrast / 100))`, after brightness. Oklab's a/b
channels are preserved by contrast. No clamp occurs between brightness and contrast. The matrices
come from [Björn Ottosson's Oklab definition](https://bottosson.github.io/posts/oklab/).

`adjustLinearColors` accepts interleaved float RGB/RGBA, with alpha normalized to 0..1. It mutates RGB
in place without clipping or quantization. `encodeLinearColors` performs final sRGB encoding and
clipping. `adjustColors` is the browser adapter: decode byte samples, adjust floats, then encode.
Neutral adjustments bypass the color calculation exactly.

Preview rendering caches the source image, runs in a worker, and keeps one running and one latest
pending request. Preview and export share the algorithm; source resolution, resampling, and image
compression may differ.

Run `node --test packages/image-editor/index.test.js` from the repository root. The server unit-test
workflow also runs these tests. Server regression tests compare the model against native Oklab and
verify that fractional resampling values survive until the adjustment.
