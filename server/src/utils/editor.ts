import { AssetFace } from 'src/database';
import { AssetOcrResponseDto } from 'src/dtos/ocr.dto';
import { ImageDimensions } from 'src/types';

type BoundingBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export const boundingBoxOverlap = (boxA: BoundingBox, boxB: BoundingBox) => {
  const overlapX1 = Math.max(boxA.x1, boxB.x1);
  const overlapY1 = Math.max(boxA.y1, boxB.y1);
  const overlapX2 = Math.min(boxA.x2, boxB.x2);
  const overlapY2 = Math.min(boxA.y2, boxB.y2);

  const overlapArea = Math.max(0, overlapX2 - overlapX1) * Math.max(0, overlapY2 - overlapY1);
  const faceArea = (boxA.x2 - boxA.x1) * (boxA.y2 - boxA.y1);
  return overlapArea / faceArea;
};

const scale = (box: BoundingBox, target: ImageDimensions, source?: ImageDimensions) => {
  const { width: sourceWidth = 1, height: sourceHeight = 1 } = source ?? {};

  return {
    x1: (box.x1 / sourceWidth) * target.width,
    y1: (box.y1 / sourceHeight) * target.height,
    x2: (box.x2 / sourceWidth) * target.width,
    y2: (box.y2 / sourceHeight) * target.height,
  };
};

export const checkFaceVisibility = (
  faces: AssetFace[],
  originalAssetDimensions: ImageDimensions,
  crop?: BoundingBox,
): { visible: AssetFace[]; hidden: AssetFace[] } => {
  if (!crop) {
    return {
      visible: faces.filter((face) => !face.isVisible),
      hidden: [],
    };
  }

  const status = faces.map((face) => {
    const scaledFace = scale(
      {
        x1: face.boundingBoxX1,
        y1: face.boundingBoxY1,
        x2: face.boundingBoxX2,
        y2: face.boundingBoxY2,
      },
      originalAssetDimensions,
      { width: face.imageWidth, height: face.imageHeight },
    );

    const overlapPercentage = boundingBoxOverlap(scaledFace, crop);

    return {
      face,
      isVisible: overlapPercentage >= 0.5,
    };
  });

  return {
    visible: status.filter((s) => s.isVisible).map((s) => s.face),
    hidden: status.filter((s) => !s.isVisible).map((s) => s.face),
  };
};

export const checkOcrVisibility = (
  ocrs: (AssetOcrResponseDto & { isVisible: boolean })[],
  originalAssetDimensions: ImageDimensions,
  crop?: BoundingBox,
): { visible: AssetOcrResponseDto[]; hidden: AssetOcrResponseDto[] } => {
  if (!crop) {
    return {
      visible: ocrs.filter((ocr) => !ocr.isVisible),
      hidden: [],
    };
  }

  const status = ocrs.map((ocr) => {
    const ocrBox = scale(
      {
        x1: Math.min(ocr.x1, ocr.x2, ocr.x3, ocr.x4),
        y1: Math.min(ocr.y1, ocr.y2, ocr.y3, ocr.y4),
        x2: Math.max(ocr.x1, ocr.x2, ocr.x3, ocr.x4),
        y2: Math.max(ocr.y1, ocr.y2, ocr.y3, ocr.y4),
      },
      originalAssetDimensions,
    );

    const overlapPercentage = boundingBoxOverlap(ocrBox, crop);

    return {
      ocr,
      isVisible: overlapPercentage >= 0.5,
    };
  });

  return {
    visible: status.filter((s) => s.isVisible).map((s) => s.ocr),
    hidden: status.filter((s) => !s.isVisible).map((s) => s.ocr),
  };
};
