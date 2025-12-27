import { AssetFace } from 'src/database';
import { EditActionCrop } from 'src/dtos/editing.dto';
import { AssetOcrResponseDto } from 'src/dtos/ocr.dto';
import { ImageDimensions } from 'src/types';

export function boundingBoxOverlap(
  boxA: { x1: number; y1: number; x2: number; y2: number },
  boxB: { x1: number; y1: number; x2: number; y2: number },
) {
  const overlapX1 = Math.max(boxA.x1, boxB.x1);
  const overlapY1 = Math.max(boxA.y1, boxB.y1);
  const overlapX2 = Math.min(boxA.x2, boxB.x2);
  const overlapY2 = Math.min(boxA.y2, boxB.y2);

  const overlapArea = Math.max(0, overlapX2 - overlapX1) * Math.max(0, overlapY2 - overlapY1);
  const faceArea = (boxA.x2 - boxA.x1) * (boxA.y2 - boxA.y1);
  return overlapArea / faceArea;
}

export function checkFaceVisibility(
  faces: AssetFace[],
  assetDimensions: ImageDimensions,
  crop?: EditActionCrop,
): { visible: AssetFace[]; hidden: AssetFace[] } {
  if (!crop) {
    return {
      visible: faces,
      hidden: [],
    };
  }

  const cropArea = {
    x1: crop.parameters.x,
    y1: crop.parameters.y,
    x2: crop.parameters.x + crop.parameters.width,
    y2: crop.parameters.y + crop.parameters.height,
  };

  const status = faces.map((face) => {
    const faceArea = {
      x1: (face.boundingBoxX1 / face.imageWidth) * assetDimensions.width,
      y1: (face.boundingBoxY1 / face.imageHeight) * assetDimensions.height,
      x2: (face.boundingBoxX2 / face.imageWidth) * assetDimensions.width,
      y2: (face.boundingBoxY2 / face.imageHeight) * assetDimensions.height,
    };

    const overlapPercentage = boundingBoxOverlap(faceArea, cropArea);

    return {
      face,
      isVisible: overlapPercentage >= 0.5,
    };
  });

  return {
    visible: status.filter((s) => s.isVisible).map((s) => s.face),
    hidden: status.filter((s) => !s.isVisible).map((s) => s.face),
  };
}

export function checkOcrVisibility(
  ocrs: AssetOcrResponseDto[],
  assetDimensions: ImageDimensions,
  crop?: EditActionCrop,
): { visible: AssetOcrResponseDto[]; hidden: AssetOcrResponseDto[] } {
  if (!crop) {
    return {
      visible: ocrs,
      hidden: [],
    };
  }

  const cropArea = {
    x1: crop.parameters.x,
    y1: crop.parameters.y,
    x2: crop.parameters.x + crop.parameters.width,
    y2: crop.parameters.y + crop.parameters.height,
  };

  const status = ocrs.map((ocr) => {
    // ocr use coordinates of a scaled image for ML
    const ocrPolygon = [
      { x: ocr.x1 * assetDimensions.width, y: ocr.y1 * assetDimensions.height },
      { x: ocr.x2 * assetDimensions.width, y: ocr.y2 * assetDimensions.height },
      { x: ocr.x3 * assetDimensions.width, y: ocr.y3 * assetDimensions.height },
      { x: ocr.x4 * assetDimensions.width, y: ocr.y4 * assetDimensions.height },
    ];

    const ocrBox = {
      x1: Math.min(ocrPolygon[0].x, ocrPolygon[1].x, ocrPolygon[2].x, ocrPolygon[3].x),
      y1: Math.min(ocrPolygon[0].y, ocrPolygon[1].y, ocrPolygon[2].y, ocrPolygon[3].y),
      x2: Math.max(ocrPolygon[0].x, ocrPolygon[1].x, ocrPolygon[2].x, ocrPolygon[3].x),
      y2: Math.max(ocrPolygon[0].y, ocrPolygon[1].y, ocrPolygon[2].y, ocrPolygon[3].y),
    };

    const overlapPercentage = boundingBoxOverlap(ocrBox, cropArea);

    return {
      ocr,
      isVisible: overlapPercentage >= 0.5,
    };
  });

  return {
    visible: status.filter((s) => s.isVisible).map((s) => s.ocr),
    hidden: status.filter((s) => !s.isVisible).map((s) => s.ocr),
  };
}
