import type { OcrBoundingBox } from '$lib/stores/ocr.svelte';
import type { Size } from '$lib/utils/container-utils';
import { getOcrBoundingBoxes } from '$lib/utils/ocr-utils';

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
    const imageSize: Size = { width: 1000, height: 500 };

    const boxes = getOcrBoundingBoxes(ocrData, imageSize);

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

  it('should map full-image box to full display area', () => {
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
    const imageSize: Size = { width: 600, height: 400 };

    const boxes = getOcrBoundingBoxes(ocrData, imageSize);

    expect(boxes[0].points).toEqual([
      { x: 0, y: 0 },
      { x: 600, y: 0 },
      { x: 600, y: 400 },
      { x: 0, y: 400 },
    ]);
  });

  it('should return empty array for empty input', () => {
    expect(getOcrBoundingBoxes([], { width: 800, height: 600 })).toEqual([]);
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
    const imageSize: Size = { width: 200, height: 200 };

    const boxes = getOcrBoundingBoxes(ocrData, imageSize);

    expect(boxes).toHaveLength(2);
    expect(boxes[0].text).toBe('first');
    expect(boxes[1].text).toBe('second');
  });
});
