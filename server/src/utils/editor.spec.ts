import { AssetFace } from 'src/database';
import { EditAction } from 'src/dtos/editing.dto';
import { AssetOcrResponseDto } from 'src/dtos/ocr.dto';
import { SourceType } from 'src/enum';
import { boundingBoxOverlap, checkFaceVisibility, checkOcrVisibility } from 'src/utils/editor';
import { describe, expect, it } from 'vitest';

describe('boundingBoxOverlap', () => {
  it('should return 1 for identical boxes', () => {
    const box = { x1: 0, y1: 0, x2: 100, y2: 100 };
    expect(boundingBoxOverlap(box, box)).toBe(1);
  });

  it('should return 0 for non-overlapping boxes', () => {
    const boxA = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const boxB = { x1: 200, y1: 200, x2: 300, y2: 300 };
    expect(boundingBoxOverlap(boxA, boxB)).toBe(0);
  });

  it('should return 0.5 for 50% overlap', () => {
    const boxA = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const boxB = { x1: 50, y1: 0, x2: 150, y2: 100 };
    expect(boundingBoxOverlap(boxA, boxB)).toBe(0.5);
  });

  it('should return 0.25 for 25% overlap', () => {
    const boxA = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const boxB = { x1: 50, y1: 50, x2: 150, y2: 150 };
    expect(boundingBoxOverlap(boxA, boxB)).toBe(0.25);
  });

  it('should return 1 when boxA is fully contained in boxB', () => {
    const boxA = { x1: 25, y1: 25, x2: 75, y2: 75 };
    const boxB = { x1: 0, y1: 0, x2: 100, y2: 100 };
    expect(boundingBoxOverlap(boxA, boxB)).toBe(1);
  });

  it('should handle partial containment correctly', () => {
    const boxA = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const boxB = { x1: 25, y1: 25, x2: 75, y2: 75 };
    // boxB is fully inside boxA, so overlap area is 50*50=2500, boxA area is 10000
    expect(boundingBoxOverlap(boxA, boxB)).toBe(0.25);
  });

  it('should handle boxes that touch at edges (no overlap)', () => {
    const boxA = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const boxB = { x1: 100, y1: 0, x2: 200, y2: 100 };
    expect(boundingBoxOverlap(boxA, boxB)).toBe(0);
  });

  it('should handle vertical partial overlap', () => {
    const boxA = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const boxB = { x1: 0, y1: 50, x2: 100, y2: 150 };
    expect(boundingBoxOverlap(boxA, boxB)).toBe(0.5);
  });
});

const createFace = (params: Partial<AssetFace> = {}): AssetFace => ({
  id: 'face-id',
  deletedAt: null,
  assetId: 'asset-id',
  boundingBoxX1: 100,
  boundingBoxX2: 200,
  boundingBoxY1: 100,
  boundingBoxY2: 200,
  imageWidth: 1000,
  imageHeight: 1000,
  personId: null,
  sourceType: SourceType.MachineLearning,
  person: null,
  updatedAt: new Date(),
  updateId: 'update-id',
  isVisible: true,
  ...params,
});

describe('checkFaceVisibility', () => {
  const assetDimensions = { width: 1000, height: 1000 };

  it('should return all faces as visible when no crop is provided', () => {
    const faces = [createFace({ id: 'face-1' }), createFace({ id: 'face-2' })];
    const result = checkFaceVisibility(faces, assetDimensions);

    expect(result.visible).toHaveLength(2);
    expect(result.hidden).toHaveLength(0);
  });

  it('should return empty arrays when no faces provided', () => {
    const result = checkFaceVisibility([], assetDimensions);

    expect(result.visible).toHaveLength(0);
    expect(result.hidden).toHaveLength(0);
  });

  it('should mark face as visible when fully inside crop area', () => {
    const faces = [createFace({ boundingBoxX1: 100, boundingBoxY1: 100, boundingBoxX2: 200, boundingBoxY2: 200 })];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 0, y: 0, width: 500, height: 500 },
    };

    const result = checkFaceVisibility(faces, assetDimensions, crop);

    expect(result.visible).toHaveLength(1);
    expect(result.hidden).toHaveLength(0);
  });

  it('should mark face as hidden when fully outside crop area', () => {
    const faces = [createFace({ boundingBoxX1: 600, boundingBoxY1: 600, boundingBoxX2: 700, boundingBoxY2: 700 })];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 0, y: 0, width: 500, height: 500 },
    };

    const result = checkFaceVisibility(faces, assetDimensions, crop);

    expect(result.visible).toHaveLength(0);
    expect(result.hidden).toHaveLength(1);
  });

  it('should mark face as visible when at least 50% overlaps with crop', () => {
    // Face spans 100-200 (100px), crop starts at 150, so 50% overlap
    const faces = [createFace({ boundingBoxX1: 100, boundingBoxY1: 100, boundingBoxX2: 200, boundingBoxY2: 200 })];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 150, y: 100, width: 500, height: 500 },
    };

    const result = checkFaceVisibility(faces, assetDimensions, crop);

    expect(result.visible).toHaveLength(1);
    expect(result.hidden).toHaveLength(0);
  });

  it('should mark face as hidden when less than 50% overlaps with crop', () => {
    // Face spans 100-200 (100px), crop starts at 160, so 40% overlap
    const faces = [createFace({ boundingBoxX1: 100, boundingBoxY1: 100, boundingBoxX2: 200, boundingBoxY2: 200 })];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 160, y: 100, width: 500, height: 500 },
    };

    const result = checkFaceVisibility(faces, assetDimensions, crop);

    expect(result.visible).toHaveLength(0);
    expect(result.hidden).toHaveLength(1);
  });

  it('should correctly categorize multiple faces', () => {
    const faces = [
      createFace({ id: 'face-inside', boundingBoxX1: 100, boundingBoxY1: 100, boundingBoxX2: 200, boundingBoxY2: 200 }),
      createFace({
        id: 'face-outside',
        boundingBoxX1: 800,
        boundingBoxY1: 800,
        boundingBoxX2: 900,
        boundingBoxY2: 900,
      }),
      // face-partial: 400-500 overlaps with crop (100x100=10000 overlap, face is 200x200=40000, so 25% - hidden)
      createFace({
        id: 'face-partial',
        boundingBoxX1: 400,
        boundingBoxY1: 400,
        boundingBoxX2: 600,
        boundingBoxY2: 600,
      }),
    ];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 0, y: 0, width: 500, height: 500 },
    };

    const result = checkFaceVisibility(faces, assetDimensions, crop);

    // face-inside is fully visible, face-partial has 25% overlap (hidden), face-outside is fully hidden
    expect(result.visible).toHaveLength(1);
    expect(result.hidden).toHaveLength(2);
    expect(result.visible.map((f) => f.id)).toContain('face-inside');
    expect(result.hidden.map((f) => f.id)).toContain('face-partial');
    expect(result.hidden.map((f) => f.id)).toContain('face-outside');
  });

  it('should handle face coordinates scaled to different image dimensions', () => {
    // Face stored at 50-100 in a 500x500 image, scaled to 1000x1000 becomes 100-200
    const faces = [
      createFace({
        boundingBoxX1: 50,
        boundingBoxY1: 50,
        boundingBoxX2: 100,
        boundingBoxY2: 100,
        imageWidth: 500,
        imageHeight: 500,
      }),
    ];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 0, y: 0, width: 200, height: 200 },
    };

    const result = checkFaceVisibility(faces, assetDimensions, crop);

    expect(result.visible).toHaveLength(1);
    expect(result.hidden).toHaveLength(0);
  });
});

const createOcr = (params: Partial<AssetOcrResponseDto> = {}): AssetOcrResponseDto => ({
  id: 'ocr-id',
  assetId: 'asset-id',
  x1: 0.1,
  y1: 0.1,
  x2: 0.2,
  y2: 0.1,
  x3: 0.2,
  y3: 0.2,
  x4: 0.1,
  y4: 0.2,
  boxScore: 0.9,
  textScore: 0.9,
  text: 'Sample Text',
  ...params,
});

describe('checkOcrVisibility', () => {
  const assetDimensions = { width: 1000, height: 1000 };

  it('should return all OCR entries as visible when no crop is provided', () => {
    const ocrs = [createOcr({ id: 'ocr-1' }), createOcr({ id: 'ocr-2' })];
    const result = checkOcrVisibility(ocrs, assetDimensions);

    expect(result.visible).toHaveLength(2);
    expect(result.hidden).toHaveLength(0);
  });

  it('should return empty arrays when no OCR entries provided', () => {
    const result = checkOcrVisibility([], assetDimensions);

    expect(result.visible).toHaveLength(0);
    expect(result.hidden).toHaveLength(0);
  });

  it('should mark OCR as visible when fully inside crop area', () => {
    // OCR box at normalized coords 0.1-0.2 = 100-200px in 1000x1000 image
    const ocrs = [createOcr()];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 0, y: 0, width: 500, height: 500 },
    };

    const result = checkOcrVisibility(ocrs, assetDimensions, crop);

    expect(result.visible).toHaveLength(1);
    expect(result.hidden).toHaveLength(0);
  });

  it('should mark OCR as hidden when fully outside crop area', () => {
    // OCR box at normalized coords 0.8-0.9 = 800-900px
    const ocrs = [createOcr({ x1: 0.8, y1: 0.8, x2: 0.9, y2: 0.8, x3: 0.9, y3: 0.9, x4: 0.8, y4: 0.9 })];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 0, y: 0, width: 500, height: 500 },
    };

    const result = checkOcrVisibility(ocrs, assetDimensions, crop);

    expect(result.visible).toHaveLength(0);
    expect(result.hidden).toHaveLength(1);
  });

  it('should mark OCR as visible when at least 50% overlaps with crop', () => {
    // OCR at 100-200px (0.1-0.2 normalized), crop starts at 150
    const ocrs = [createOcr()];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 150, y: 100, width: 500, height: 500 },
    };

    const result = checkOcrVisibility(ocrs, assetDimensions, crop);

    expect(result.visible).toHaveLength(1);
    expect(result.hidden).toHaveLength(0);
  });

  it('should mark OCR as hidden when less than 50% overlaps with crop', () => {
    // OCR at 100-200px, crop starts at 160 = 40% overlap
    const ocrs = [createOcr()];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 160, y: 100, width: 500, height: 500 },
    };

    const result = checkOcrVisibility(ocrs, assetDimensions, crop);

    expect(result.visible).toHaveLength(0);
    expect(result.hidden).toHaveLength(1);
  });

  it('should correctly categorize multiple OCR entries', () => {
    const ocrs = [
      createOcr({ id: 'ocr-inside', x1: 0.1, y1: 0.1, x2: 0.2, y2: 0.1, x3: 0.2, y3: 0.2, x4: 0.1, y4: 0.2 }),
      createOcr({ id: 'ocr-outside', x1: 0.8, y1: 0.8, x2: 0.9, y2: 0.8, x3: 0.9, y3: 0.9, x4: 0.8, y4: 0.9 }),
    ];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 0, y: 0, width: 500, height: 500 },
    };

    const result = checkOcrVisibility(ocrs, assetDimensions, crop);

    expect(result.visible).toHaveLength(1);
    expect(result.hidden).toHaveLength(1);
    expect(result.visible[0].id).toBe('ocr-inside');
    expect(result.hidden[0].id).toBe('ocr-outside');
  });

  it('should handle rotated/skewed OCR polygons by using bounding box', () => {
    // Rotated rectangle - the function should compute the bounding box correctly
    const ocrs = [
      createOcr({
        id: 'ocr-rotated',
        x1: 0.15,
        y1: 0.1, // top
        x2: 0.2,
        y2: 0.15, // right
        x3: 0.15,
        y3: 0.2, // bottom
        x4: 0.1,
        y4: 0.15, // left
      }),
    ];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 0, y: 0, width: 500, height: 500 },
    };

    const result = checkOcrVisibility(ocrs, assetDimensions, crop);

    expect(result.visible).toHaveLength(1);
    expect(result.hidden).toHaveLength(0);
  });

  it('should handle different asset dimensions', () => {
    const smallDimensions = { width: 500, height: 500 };
    // OCR at 0.1-0.2 normalized = 50-100px in 500x500 image
    const ocrs = [createOcr()];
    const crop = {
      action: EditAction.Crop,
      parameters: { x: 0, y: 0, width: 200, height: 200 },
    };

    const result = checkOcrVisibility(ocrs, smallDimensions, crop);

    expect(result.visible).toHaveLength(1);
    expect(result.hidden).toHaveLength(0);
  });
});
