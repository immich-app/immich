import type { Faces } from '$lib/stores/people.store';
import type { DisplayMetrics } from '$lib/utils/container-utils';
import { getBoundingBox } from '$lib/utils/people-utils';

const makeFace = (overrides: Partial<Faces> = {}): Faces => ({
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
    const metrics: DisplayMetrics = { displayWidth: 800, displayHeight: 600, offsetX: 0, offsetY: 0 };

    const boxes = getBoundingBox([face], metrics);

    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toEqual({
      top: Math.round(600 * (750 / 3000)),
      left: Math.round(800 * (1000 / 4000)),
      width: Math.round(800 * (2000 / 4000) - 800 * (1000 / 4000)),
      height: Math.round(600 * (1500 / 3000) - 600 * (750 / 3000)),
    });
  });

  it('should apply offsets for letterboxed display', () => {
    const face = makeFace({
      imageWidth: 1000,
      imageHeight: 1000,
      boundingBoxX1: 0,
      boundingBoxY1: 0,
      boundingBoxX2: 1000,
      boundingBoxY2: 1000,
    });
    const metrics: DisplayMetrics = { displayWidth: 600, displayHeight: 600, offsetX: 100, offsetY: 0 };

    const boxes = getBoundingBox([face], metrics);

    expect(boxes[0]).toEqual({
      top: 0,
      left: 100,
      width: 600,
      height: 600,
    });
  });

  it('should handle zoom by pre-scaled metrics', () => {
    const face = makeFace({
      imageWidth: 1000,
      imageHeight: 1000,
      boundingBoxX1: 0,
      boundingBoxY1: 0,
      boundingBoxX2: 500,
      boundingBoxY2: 500,
    });
    const metrics: DisplayMetrics = {
      displayWidth: 1600,
      displayHeight: 1200,
      offsetX: -200,
      offsetY: -100,
    };

    const boxes = getBoundingBox([face], metrics);

    expect(boxes[0]).toEqual({
      top: -100,
      left: -200,
      width: 800,
      height: 600,
    });
  });

  it('should return empty array for empty faces', () => {
    const metrics: DisplayMetrics = { displayWidth: 800, displayHeight: 600, offsetX: 0, offsetY: 0 };
    expect(getBoundingBox([], metrics)).toEqual([]);
  });

  it('should handle multiple faces', () => {
    const faces = [
      makeFace({ boundingBoxX1: 0, boundingBoxY1: 0, boundingBoxX2: 1000, boundingBoxY2: 1000 }),
      makeFace({ boundingBoxX1: 2000, boundingBoxY1: 1500, boundingBoxX2: 3000, boundingBoxY2: 2500 }),
    ];
    const metrics: DisplayMetrics = { displayWidth: 800, displayHeight: 600, offsetX: 0, offsetY: 0 };

    const boxes = getBoundingBox(faces, metrics);

    expect(boxes).toHaveLength(2);
    expect(boxes[0].left).toBeLessThan(boxes[1].left);
  });
});
