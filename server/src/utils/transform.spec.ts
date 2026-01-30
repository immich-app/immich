import { AssetEditAction, AssetEditActionItem, MirrorAxis } from 'src/dtos/editing.dto';
import { AssetOcrResponseDto } from 'src/dtos/ocr.dto';
import { transformFaceBoundingBox, transformOcrBoundingBox } from 'src/utils/transform';
import { describe, expect, it } from 'vitest';

describe('transformFaceBoundingBox', () => {
  const baseFace = {
    boundingBoxX1: 100,
    boundingBoxY1: 100,
    boundingBoxX2: 200,
    boundingBoxY2: 200,
    imageWidth: 1000,
    imageHeight: 800,
  };

  const baseDimensions = { width: 1000, height: 800 };

  describe('with no edits', () => {
    it('should return unchanged bounding box', () => {
      const result = transformFaceBoundingBox(baseFace, [], baseDimensions);
      expect(result).toEqual(baseFace);
    });
  });

  describe('with crop edit', () => {
    it('should adjust bounding box for crop offset', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Crop, parameters: { x: 50, y: 50, width: 400, height: 300 } },
      ];
      const result = transformFaceBoundingBox(baseFace, edits, baseDimensions);

      expect(result.boundingBoxX1).toBe(50);
      expect(result.boundingBoxY1).toBe(50);
      expect(result.boundingBoxX2).toBe(150);
      expect(result.boundingBoxY2).toBe(150);
      expect(result.imageWidth).toBe(400);
      expect(result.imageHeight).toBe(300);
    });

    it('should handle face partially outside crop area', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Crop, parameters: { x: 150, y: 150, width: 400, height: 300 } },
      ];
      const result = transformFaceBoundingBox(baseFace, edits, baseDimensions);

      expect(result.boundingBoxX1).toBe(-50);
      expect(result.boundingBoxY1).toBe(-50);
      expect(result.boundingBoxX2).toBe(50);
      expect(result.boundingBoxY2).toBe(50);
    });
  });

  describe('with rotate edit', () => {
    it('should rotate 90 degrees clockwise', () => {
      const edits: AssetEditActionItem[] = [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }];
      const result = transformFaceBoundingBox(baseFace, edits, baseDimensions);

      expect(result.imageWidth).toBe(800);
      expect(result.imageHeight).toBe(1000);

      expect(result.boundingBoxX1).toBe(600);
      expect(result.boundingBoxY1).toBe(100);
      expect(result.boundingBoxX2).toBe(700);
      expect(result.boundingBoxY2).toBe(200);
    });

    it('should rotate 180 degrees', () => {
      const edits: AssetEditActionItem[] = [{ action: AssetEditAction.Rotate, parameters: { angle: 180 } }];
      const result = transformFaceBoundingBox(baseFace, edits, baseDimensions);

      expect(result.imageWidth).toBe(1000);
      expect(result.imageHeight).toBe(800);

      expect(result.boundingBoxX1).toBe(800);
      expect(result.boundingBoxY1).toBe(600);
      expect(result.boundingBoxX2).toBe(900);
      expect(result.boundingBoxY2).toBe(700);
    });

    it('should rotate 270 degrees', () => {
      const edits: AssetEditActionItem[] = [{ action: AssetEditAction.Rotate, parameters: { angle: 270 } }];
      const result = transformFaceBoundingBox(baseFace, edits, baseDimensions);

      expect(result.imageWidth).toBe(800);
      expect(result.imageHeight).toBe(1000);
    });
  });

  describe('with mirror edit', () => {
    it('should mirror horizontally', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      ];
      const result = transformFaceBoundingBox(baseFace, edits, baseDimensions);

      expect(result.boundingBoxX1).toBe(800);
      expect(result.boundingBoxY1).toBe(100);
      expect(result.boundingBoxX2).toBe(900);
      expect(result.boundingBoxY2).toBe(200);
      expect(result.imageWidth).toBe(1000);
      expect(result.imageHeight).toBe(800);
    });

    it('should mirror vertically', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      ];
      const result = transformFaceBoundingBox(baseFace, edits, baseDimensions);

      expect(result.boundingBoxX1).toBe(100);
      expect(result.boundingBoxY1).toBe(600);
      expect(result.boundingBoxX2).toBe(200);
      expect(result.boundingBoxY2).toBe(700);
      expect(result.imageWidth).toBe(1000);
      expect(result.imageHeight).toBe(800);
    });
  });

  describe('with combined edits', () => {
    it('should apply crop then rotate', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Crop, parameters: { x: 50, y: 50, width: 400, height: 300 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ];
      const result = transformFaceBoundingBox(baseFace, edits, baseDimensions);

      expect(result.imageWidth).toBe(300);
      expect(result.imageHeight).toBe(400);
    });

    it('should apply crop then mirror', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 500, height: 400 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      ];
      const result = transformFaceBoundingBox(baseFace, edits, baseDimensions);

      expect(result.boundingBoxX1).toBe(100);
      expect(result.boundingBoxX2).toBe(200);
      expect(result.boundingBoxY1).toBe(200);
      expect(result.boundingBoxY2).toBe(300);
    });
  });

  describe('with scaled dimensions', () => {
    it('should scale face to match different image dimensions', () => {
      const scaledDimensions = { width: 500, height: 400 }; // Half the original size
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Crop, parameters: { x: 50, y: 50, width: 200, height: 150 } },
      ];
      const result = transformFaceBoundingBox(baseFace, edits, scaledDimensions);

      expect(result.boundingBoxX1).toBe(0);
      expect(result.boundingBoxY1).toBe(0);
      expect(result.boundingBoxX2).toBe(50);
      expect(result.boundingBoxY2).toBe(50);
    });
  });
});

describe('transformOcrBoundingBox', () => {
  const baseOcr: AssetOcrResponseDto = {
    id: 'ocr-1',
    assetId: 'asset-1',
    x1: 0.1,
    y1: 0.1,
    x2: 0.2,
    y2: 0.1,
    x3: 0.2,
    y3: 0.2,
    x4: 0.1,
    y4: 0.2,
    boxScore: 0.9,
    textScore: 0.85,
    text: 'Test OCR',
  };

  const baseDimensions = { width: 1000, height: 800 };

  describe('with no edits', () => {
    it('should return unchanged bounding box', () => {
      const result = transformOcrBoundingBox(baseOcr, [], baseDimensions);
      expect(result).toEqual(baseOcr);
    });
  });

  describe('with crop edit', () => {
    it('should adjust normalized coordinates for crop', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Crop, parameters: { x: 100, y: 80, width: 400, height: 320 } },
      ];
      const result = transformOcrBoundingBox(baseOcr, edits, baseDimensions);

      // Original OCR: (0.1,0.1)-(0.2,0.2) on 1000x800 = (100,80)-(200,160)
      // After crop offset (100,80): (0,0)-(100,80)
      // Normalized to 400x320: (0,0)-(0.25,0.25)
      expect(result.x1).toBeCloseTo(0, 5);
      expect(result.y1).toBeCloseTo(0, 5);
      expect(result.x2).toBeCloseTo(0.25, 5);
      expect(result.y2).toBeCloseTo(0, 5);
      expect(result.x3).toBeCloseTo(0.25, 5);
      expect(result.y3).toBeCloseTo(0.25, 5);
      expect(result.x4).toBeCloseTo(0, 5);
      expect(result.y4).toBeCloseTo(0.25, 5);
    });
  });

  describe('with rotate edit', () => {
    it('should rotate normalized coordinates 90 degrees and reorder points', () => {
      const edits: AssetEditActionItem[] = [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }];
      const result = transformOcrBoundingBox(baseOcr, edits, baseDimensions);

      expect(result.id).toBe(baseOcr.id);
      expect(result.text).toBe(baseOcr.text);
      expect(result.x1).toBeCloseTo(0.8, 5);
      expect(result.y1).toBeCloseTo(0.1, 5);
      expect(result.x2).toBeCloseTo(0.9, 5);
      expect(result.y2).toBeCloseTo(0.1, 5);
      expect(result.x3).toBeCloseTo(0.9, 5);
      expect(result.y3).toBeCloseTo(0.2, 5);
      expect(result.x4).toBeCloseTo(0.8, 5);
      expect(result.y4).toBeCloseTo(0.2, 5);
    });

    it('should rotate 180 degrees and reorder points', () => {
      const edits: AssetEditActionItem[] = [{ action: AssetEditAction.Rotate, parameters: { angle: 180 } }];
      const result = transformOcrBoundingBox(baseOcr, edits, baseDimensions);

      expect(result.x1).toBeCloseTo(0.8, 5);
      expect(result.y1).toBeCloseTo(0.8, 5);
      expect(result.x2).toBeCloseTo(0.9, 5);
      expect(result.y2).toBeCloseTo(0.8, 5);
      expect(result.x3).toBeCloseTo(0.9, 5);
      expect(result.y3).toBeCloseTo(0.9, 5);
      expect(result.x4).toBeCloseTo(0.8, 5);
      expect(result.y4).toBeCloseTo(0.9, 5);
    });

    it('should rotate 270 degrees and reorder points', () => {
      const edits: AssetEditActionItem[] = [{ action: AssetEditAction.Rotate, parameters: { angle: 270 } }];
      const result = transformOcrBoundingBox(baseOcr, edits, baseDimensions);

      expect(result.id).toBe(baseOcr.id);
      expect(result.text).toBe(baseOcr.text);
      expect(result.x1).toBeCloseTo(0.1, 5);
      expect(result.y1).toBeCloseTo(0.8, 5);
      expect(result.x2).toBeCloseTo(0.2, 5);
      expect(result.y2).toBeCloseTo(0.8, 5);
      expect(result.x3).toBeCloseTo(0.2, 5);
      expect(result.y3).toBeCloseTo(0.9, 5);
      expect(result.x4).toBeCloseTo(0.1, 5);
      expect(result.y4).toBeCloseTo(0.9, 5);
    });
  });

  describe('with mirror edit', () => {
    it('should mirror horizontally', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      ];
      const result = transformOcrBoundingBox(baseOcr, edits, baseDimensions);

      expect(result.x1).toBeCloseTo(0.9, 5);
      expect(result.y1).toBeCloseTo(0.1, 5);
    });

    it('should mirror vertically', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      ];
      const result = transformOcrBoundingBox(baseOcr, edits, baseDimensions);

      expect(result.x1).toBeCloseTo(0.1, 5);
      expect(result.y1).toBeCloseTo(0.9, 5);
    });
  });

  describe('with combined edits', () => {
    it('should preserve OCR metadata through transforms', () => {
      const edits: AssetEditActionItem[] = [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 500, height: 400 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ];
      const result = transformOcrBoundingBox(baseOcr, edits, baseDimensions);

      expect(result.id).toBe(baseOcr.id);
      expect(result.assetId).toBe(baseOcr.assetId);
      expect(result.boxScore).toBe(baseOcr.boxScore);
      expect(result.textScore).toBe(baseOcr.textScore);
      expect(result.text).toBe(baseOcr.text);
    });
  });
});
