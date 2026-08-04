import type { Faces } from '$lib/managers/asset-viewer-manager.svelte';
import type { Size } from '$lib/utils/container-utils';
import { getBoundingBox, getRelativeFaceLabelLeft } from '$lib/utils/people-utils';

const makeFace = (overrides: Partial<Faces> = {}): Faces => ({
  id: 'face-1',
  imageWidth: 4000,
  imageHeight: 3000,
  boundingBoxX1: 1000,
  boundingBoxY1: 750,
  boundingBoxX2: 2000,
  boundingBoxY2: 1500,
  ...overrides,
});

describe('getBoundingBox', () => {
  it('should scale face coordinates to display dimensions', () => {
    const face = makeFace();
    const imageSize: Size = { width: 800, height: 600 };

    const boxes = getBoundingBox([face], imageSize);

    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toEqual({
      id: 'face-1',
      top: 600 * (750 / 3000),
      left: 800 * (1000 / 4000),
      width: 800 * (2000 / 4000) - 800 * (1000 / 4000),
      height: 600 * (1500 / 3000) - 600 * (750 / 3000),
    });
  });

  it('should map full-image face to full display area', () => {
    const face = makeFace({
      imageWidth: 1000,
      imageHeight: 1000,
      boundingBoxX1: 0,
      boundingBoxY1: 0,
      boundingBoxX2: 1000,
      boundingBoxY2: 1000,
    });
    const imageSize: Size = { width: 600, height: 600 };

    const boxes = getBoundingBox([face], imageSize);

    expect(boxes[0]).toEqual({
      id: 'face-1',
      top: 0,
      left: 0,
      width: 600,
      height: 600,
    });
  });

  it('should return empty array for empty faces', () => {
    expect(getBoundingBox([], { width: 800, height: 600 })).toEqual([]);
  });

  it('should handle multiple faces', () => {
    const faces = [
      makeFace({ id: 'face-1', boundingBoxX1: 0, boundingBoxY1: 0, boundingBoxX2: 1000, boundingBoxY2: 1000 }),
      makeFace({ id: 'face-2', boundingBoxX1: 2000, boundingBoxY1: 1500, boundingBoxX2: 3000, boundingBoxY2: 2500 }),
    ];

    const boxes = getBoundingBox(faces, { width: 800, height: 600 });

    expect(boxes).toHaveLength(2);
    expect(boxes[0].left).toBeLessThan(boxes[1].left);
  });
});

describe('getRelativeFaceLabelLeft', () => {
  it('should right align face label by default inside container bounds', () => {
    // box: left 100, width 50; label: width 80; overlay: 1000
    // preferred absolute X = 100 + 50 - 80 = 70 (clamped: 70)
    // localLeft = 70 - 100 = -30
    expect(getRelativeFaceLabelLeft(100, 50, 80, 1000)).toBe(-30);
  });

  it('should clamp left edge when label overflows container left boundary', () => {
    // box: left 10, width 40; label: width 150; overlay: 1000
    // preferred absolute X = 10 + 40 - 150 = -100 -> clamped to 0
    // localLeft = 0 - 10 = -10 (label left edge aligns to 0px in container)
    expect(getRelativeFaceLabelLeft(10, 40, 150, 1000)).toBe(-10);
  });

  it('should clamp right edge when label overflows container right boundary', () => {
    // box: left 950, width 40; label: width 200; overlay: 1000
    // preferred absolute X = 950 + 40 - 200 = 790
    // clamped absolute X = min(790, 800) = 790
    expect(getRelativeFaceLabelLeft(950, 40, 200, 1000)).toBe(-160);
  });

  it('should handle boundary case when label exactly fits inside face box', () => {
    // box: left 100, width 100; label: width 100; overlay: 1000
    // preferred absolute X = 100 + 100 - 100 = 100
    // localLeft = 100 - 100 = 0
    expect(getRelativeFaceLabelLeft(100, 100, 100, 1000)).toBe(0);
  });

  it('should clamp gracefully when label width exceeds narrow overlay width', () => {
    // box: left 10, width 30; label: width 160; overlay: 80 (narrow viewport)
    // maxX = max(0, 80 - 160) = 0
    // preferred absolute X = 10 + 30 - 160 = -120 -> clamped to 0
    // localLeft = 0 - 10 = -10
    expect(getRelativeFaceLabelLeft(10, 30, 160, 80)).toBe(-10);
  });
});
