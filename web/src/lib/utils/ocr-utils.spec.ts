import type { OcrBoundingBox } from '$lib/stores/ocr.svelte';
import type { DisplayMetrics } from '$lib/utils/container-utils';
import { calculateBoundingBoxDimensions, getOcrBoundingBoxes } from '$lib/utils/ocr-utils';

describe('getOcrBoundingBoxes', () => {
  it('should scale normalized coordinates by display dimensions', () => {
    const ocrData: OcrBoundingBox[] = [
      {
        id: 'box1',
        assetId: 'asset1',
        x1: 0.1,
        y1: 0.2,
        x2: 0.9,
        y2: 0.2,
        x3: 0.9,
        y3: 0.8,
        x4: 0.1,
        y4: 0.8,
        boxScore: 0.95,
        textScore: 0.9,
        text: 'hello',
      },
    ];
    const metrics: DisplayMetrics = { displayWidth: 1000, displayHeight: 500, offsetX: 0, offsetY: 0 };

    const boxes = getOcrBoundingBoxes(ocrData, metrics);

    expect(boxes).toHaveLength(1);
    expect(boxes[0].id).toBe('box1');
    expect(boxes[0].text).toBe('hello');
    expect(boxes[0].confidence).toBe(0.9);
    expect(boxes[0].points).toEqual([
      { x: 100, y: 100 },
      { x: 900, y: 100 },
      { x: 900, y: 400 },
      { x: 100, y: 400 },
    ]);
  });

  it('should apply offsets for letterboxed images', () => {
    const ocrData: OcrBoundingBox[] = [
      {
        id: 'box1',
        assetId: 'asset1',
        x1: 0,
        y1: 0,
        x2: 1,
        y2: 0,
        x3: 1,
        y3: 1,
        x4: 0,
        y4: 1,
        boxScore: 0.9,
        textScore: 0.8,
        text: 'test',
      },
    ];
    const metrics: DisplayMetrics = { displayWidth: 600, displayHeight: 400, offsetX: 100, offsetY: 50 };

    const boxes = getOcrBoundingBoxes(ocrData, metrics);

    expect(boxes[0].points).toEqual([
      { x: 100, y: 50 },
      { x: 700, y: 50 },
      { x: 700, y: 450 },
      { x: 100, y: 450 },
    ]);
  });

  it('should return empty array for empty input', () => {
    const metrics: DisplayMetrics = { displayWidth: 800, displayHeight: 600, offsetX: 0, offsetY: 0 };
    expect(getOcrBoundingBoxes([], metrics)).toEqual([]);
  });

  it('should handle multiple boxes', () => {
    const ocrData: OcrBoundingBox[] = [
      {
        id: 'a',
        assetId: 'asset1',
        x1: 0,
        y1: 0,
        x2: 0.5,
        y2: 0,
        x3: 0.5,
        y3: 0.5,
        x4: 0,
        y4: 0.5,
        boxScore: 0.9,
        textScore: 0.8,
        text: 'first',
      },
      {
        id: 'b',
        assetId: 'asset1',
        x1: 0.5,
        y1: 0.5,
        x2: 1,
        y2: 0.5,
        x3: 1,
        y3: 1,
        x4: 0.5,
        y4: 1,
        boxScore: 0.9,
        textScore: 0.7,
        text: 'second',
      },
    ];
    const metrics: DisplayMetrics = { displayWidth: 200, displayHeight: 200, offsetX: 0, offsetY: 0 };

    const boxes = getOcrBoundingBoxes(ocrData, metrics);

    expect(boxes).toHaveLength(2);
    expect(boxes[0].text).toBe('first');
    expect(boxes[1].text).toBe('second');
  });
});

describe('calculateBoundingBoxDimensions', () => {
  it('should compute dimensions for an axis-aligned rectangle', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 110, y: 10 },
      { x: 110, y: 60 },
      { x: 10, y: 60 },
    ];

    const dims = calculateBoundingBoxDimensions(points);

    expect(dims.minX).toBe(10);
    expect(dims.maxX).toBe(110);
    expect(dims.minY).toBe(10);
    expect(dims.maxY).toBe(60);
    expect(dims.width).toBe(100);
    expect(dims.height).toBe(50);
    expect(dims.centerX).toBe(60);
    expect(dims.centerY).toBe(35);
    expect(dims.rotation).toBeCloseTo(0);
    expect(dims.skewX).toBeCloseTo(0);
    expect(dims.skewY).toBeCloseTo(0);
  });

  it('should detect rotation for a tilted rectangle', () => {
    const angle = 15;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const w = 100;
    const h = 50;
    const points = [
      { x: 0, y: 0 },
      { x: w * cos, y: w * sin },
      { x: w * cos - h * sin, y: w * sin + h * cos },
      { x: -h * sin, y: h * cos },
    ];

    const dims = calculateBoundingBoxDimensions(points);
    expect(dims.rotation).toBeCloseTo(angle);
  });

  it('should detect skew when edges are not parallel', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 110, y: 10 },
      { x: 115, y: 60 },
      { x: 5, y: 60 },
    ];

    const dims = calculateBoundingBoxDimensions(points);
    expect(dims.skewX).not.toBeCloseTo(0);
  });
});
