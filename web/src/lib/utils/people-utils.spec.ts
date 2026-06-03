import type { Faces } from '$lib/managers/asset-viewer-manager.svelte';
import type { Size } from '$lib/utils/container-utils';
import { getBoundingBox, scaleFaceRectOnResize, type FaceRectState, type ResizeContext } from '$lib/utils/people-utils';

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

describe('scaleFaceRectOnResize', () => {
  const makeRect = (overrides: Partial<FaceRectState> = {}): FaceRectState => ({
    left: 300,
    top: 400,
    scaleX: 1,
    scaleY: 1,
    ...overrides,
  });

  const makePrevious = (overrides: Partial<ResizeContext> = {}): ResizeContext => ({
    offsetX: 100,
    offsetY: 50,
    contentWidth: 800,
    ...overrides,
  });

  it('should preserve relative position when container doubles in size', () => {
    const rect = makeRect({ left: 300, top: 250 });
    const previous = makePrevious({ offsetX: 100, offsetY: 50, contentWidth: 800 });

    const result = scaleFaceRectOnResize(rect, previous, { offsetX: 200, offsetY: 100, contentWidth: 1600 });

    expect(result.left).toBe(600);
    expect(result.top).toBe(500);
    expect(result.scaleX).toBe(2);
    expect(result.scaleY).toBe(2);
  });

  it('should preserve relative position when container halves in size', () => {
    const rect = makeRect({ left: 300, top: 250 });
    const previous = makePrevious({ offsetX: 100, offsetY: 50, contentWidth: 800 });

    const result = scaleFaceRectOnResize(rect, previous, { offsetX: 50, offsetY: 25, contentWidth: 400 });

    expect(result.left).toBe(150);
    expect(result.top).toBe(125);
    expect(result.scaleX).toBe(0.5);
    expect(result.scaleY).toBe(0.5);
  });

  it('should handle no change in dimensions', () => {
    const rect = makeRect({ left: 300, top: 250, scaleX: 1.5, scaleY: 1.5 });
    const previous = makePrevious({ offsetX: 100, offsetY: 50, contentWidth: 800 });

    const result = scaleFaceRectOnResize(rect, previous, { offsetX: 100, offsetY: 50, contentWidth: 800 });

    expect(result.left).toBe(300);
    expect(result.top).toBe(250);
    expect(result.scaleX).toBe(1.5);
    expect(result.scaleY).toBe(1.5);
  });

  it('should handle offset changes without content width change', () => {
    const rect = makeRect({ left: 300, top: 250 });
    const previous = makePrevious({ offsetX: 100, offsetY: 50, contentWidth: 800 });

    const result = scaleFaceRectOnResize(rect, previous, { offsetX: 150, offsetY: 75, contentWidth: 800 });

    expect(result.left).toBe(350);
    expect(result.top).toBe(275);
    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1);
  });

  it('should compound existing scale factors', () => {
    const rect = makeRect({ left: 300, top: 250, scaleX: 2, scaleY: 3 });
    const previous = makePrevious({ contentWidth: 800 });

    const result = scaleFaceRectOnResize(rect, previous, { ...previous, contentWidth: 1600 });

    expect(result.scaleX).toBe(4);
    expect(result.scaleY).toBe(6);
  });

  it('should handle rect at image origin', () => {
    const rect = makeRect({ left: 100, top: 50 });
    const previous = makePrevious({ offsetX: 100, offsetY: 50, contentWidth: 800 });

    const result = scaleFaceRectOnResize(rect, previous, { offsetX: 200, offsetY: 100, contentWidth: 1600 });

    expect(result.left).toBe(200);
    expect(result.top).toBe(100);
  });
});
