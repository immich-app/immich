import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adjustColors,
  adjustLinearColors,
  encodeLinearColors,
} from './index.js';

const pixel = (rgb, parameters) => {
  const data = new Uint8Array(rgb);
  adjustColors(data, 3, parameters);
  return [...data];
};

test('neutral preserves every byte, float sample, highlight and alpha', () => {
  const data = Uint8Array.from({ length: 1024 }, (_, i) => i % 256);
  const original = data.slice();
  adjustColors(data, 4, { brightness: 0, contrast: 0 });
  assert.deepEqual(data, original);
  const floats = new Float32Array([-0.05, 0.000123, 1.5, 0.2862745]);
  const copy = floats.slice();
  adjustLinearColors(floats, 4, { brightness: 0, contrast: 0 });
  assert.deepEqual(floats, copy);
});

test('contrast is monotone and its minimum flattens gray lightness at the Oklab midpoint', () => {
  for (const contrast of [-100, 100]) {
    let previous = -1;
    for (let gray = 0; gray <= 255; gray++) {
      const output = pixel([gray, gray, gray], { brightness: 0, contrast });
      assert.equal(output[0], output[1]);
      assert.equal(output[1], output[2]);
      assert.ok(output[0] >= previous);
      previous = output[0];
      if (contrast === -100) {
        assert.equal(output[0], 99);
      }
    }
  }
  assert.deepEqual(
    pixel([0, 0, 0], { brightness: 0, contrast: 100 }),
    [0, 0, 0],
  );
  assert.deepEqual(
    pixel([255, 255, 255], { brightness: 0, contrast: 100 }),
    [255, 255, 255],
  );
  assert.ok(pixel([50, 50, 50], { brightness: 0, contrast: 100 })[0] < 50);
  assert.ok(pixel([200, 200, 200], { brightness: 0, contrast: 100 })[0] > 200);
});

test('brightness is a linear-light gain and preserves alpha', () => {
  const floats = new Float64Array([0.4, 0.6, 0.8, 73 / 255]);
  adjustLinearColors(floats, 4, { brightness: 25, contrast: 0 });
  assert.deepEqual([...floats], [0.5, 0.75, 1, 73 / 255]);
  assert.deepEqual([...encodeLinearColors(floats, 4)], [188, 225, 255, 73]);
  adjustLinearColors(floats, 4, { brightness: -100, contrast: 0 });
  assert.deepEqual([...floats], [0, 0, 0, 73 / 255]);
});

test('highlight headroom survives brightness before contrast brings it back into range', () => {
  const input = new Float64Array([0.8, 0.8, 0.8]);
  const parameters = { brightness: 100, contrast: -50 };
  adjustLinearColors(input, 3, parameters);
  const expected = (0.5 * Math.cbrt(1.6) + 0.25) ** 3;
  for (const value of input) {
    assert.ok(Math.abs(value - expected) < 3e-7);
  }
  const clipped = new Float64Array([1, 1, 1]);
  adjustLinearColors(clipped, 3, { brightness: 0, contrast: -50 });
  assert.ok(input[0] > clipped[0] + 0.1);
});

test('float processing preserves extended values and never quantizes intermediate samples', () => {
  const data = new Float64Array([-0.02, 0.000123, 1.2, 0.5]);
  adjustLinearColors(data, 4, { brightness: 50, contrast: 0 });
  assert.ok(Math.abs(data[0] + 0.03) < 1e-15);
  assert.ok(Math.abs(data[1] - 0.0001845) < 1e-15);
  assert.ok(Math.abs(data[2] - 1.8) < 1e-15);
  assert.equal(data[3], 0.5);
  const encoded = encodeLinearColors(data, 4);
  assert.equal(encoded[0], 0);
  assert.equal(encoded[2], 255);
  assert.equal(encoded[3], 128);
});

test('RGB export and RGBA browser buffers produce the same colors', () => {
  const rgb = new Uint8Array([4, 50, 100, 100, 150, 200, 240, 100, 20]);
  const rgba = new Uint8ClampedArray([
    4, 50, 100, 10, 100, 150, 200, 100, 240, 100, 20, 200,
  ]);
  adjustColors(rgb, 3, { brightness: 30, contrast: 75 });
  adjustColors(rgba, 4, { brightness: 30, contrast: 75 });
  assert.deepEqual(
    [...rgba].filter((_, i) => i % 4 !== 3),
    [...rgb],
  );
  assert.deepEqual([rgba[3], rgba[7], rgba[11]], [10, 100, 200]);
});

test('invalid parameters and pixel layouts are rejected', () => {
  for (const contrast of [NaN, Infinity, -101, 101]) {
    assert.throws(
      () => pixel([0, 0, 0], { brightness: 0, contrast }),
      RangeError,
    );
  }
  assert.throws(
    () => adjustColors(new Uint8Array(3), 4, { brightness: 0, contrast: 0 }),
    RangeError,
  );
});

test('final transfer table stays within one byte of the exact sRGB curve', () => {
  const source = Float32Array.from(
    { length: 65_536 * 3 },
    (_, i) => Math.floor(i / 3) / 65_535,
  );
  const encoded = encodeLinearColors(source, 3);
  for (let i = 0; i < source.length; i += 3) {
    const value = source[i];
    const exact = Math.round(
      (value <= 0.0031308
        ? value * 12.92
        : 1.055 * value ** (1 / 2.4) - 0.055) * 255,
    );
    assert.ok(Math.abs(encoded[i] - exact) <= 1);
  }
});
