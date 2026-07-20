import { AssetFace } from 'src/database';
import { AssetEditActionItem, CropParameters, MirrorAxis } from 'src/dtos/editing.dto';
import { AssetOcrResponseDto } from 'src/dtos/ocr.dto';
import { ImageDimensions } from 'src/types';

type BoundingBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type ExtractRectangle = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const splitRotation = (angle: number) => {
  let straightenAngle = angle % 90;
  if (straightenAngle > 45) {
    straightenAngle -= 90;
  }
  if (straightenAngle < -45) {
    straightenAngle += 90;
  }
  if (Math.abs(straightenAngle) < 1e-10) {
    straightenAngle = 0;
  }

  const quarterTurn = (((Math.round((angle - straightenAngle) / 90) * 90) % 360) + 360) % 360;
  return { quarterTurn, straightenAngle };
};

export const getEffectiveStraightenRotation = (angle: number, edits: AssetEditActionItem[] = []) => {
  const { quarterTurn, straightenAngle } = splitRotation(angle);
  const mirrorCount = edits.filter((edit) => edit.action === 'mirror').length;
  return quarterTurn + (mirrorCount % 2 === 1 ? -straightenAngle : straightenAngle);
};

export const getStraightenScale = ({ width, height }: ImageDimensions, straightenAngle: number) => {
  if (straightenAngle === 0 || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 1;
  }

  const radians = (Math.abs(straightenAngle) * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const newWidthRatio = (width * cos + height * sin) / width;
  const newHeightRatio = (width * sin + height * cos) / height;
  return Math.max(newWidthRatio, newHeightRatio, 1);
};

export const getRotatedCanvasDimensions = ({ width, height }: ImageDimensions, angle: number): ImageDimensions => {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));

  return {
    width: Math.round(width * cos + height * sin),
    height: Math.round(width * sin + height * cos),
  };
};

export const getStraightenExtractRectangle = (
  crop: CropParameters,
  imageSize: ImageDimensions,
  angle: number,
  edits: AssetEditActionItem[] = [],
  clamp = true,
): ExtractRectangle => {
  const { quarterTurn, straightenAngle } = splitRotation(angle);
  const mirrorEdits = edits.filter((edit) => edit.action === 'mirror');
  const effectiveAngle = getEffectiveStraightenRotation(angle, edits);
  const target = getRotatedCanvasDimensions(imageSize, effectiveAngle);
  const straightenScale = getStraightenScale(imageSize, straightenAngle);
  const centerRotation = mirrorEdits.length % 2 === 1 ? (360 - quarterTurn) % 360 : quarterTurn;
  const centerRotationRadians = (centerRotation * Math.PI) / 180;
  const centerRotationCos = Math.cos(centerRotationRadians);
  const centerRotationSin = Math.sin(centerRotationRadians);

  const cropWidth = crop.width / straightenScale;
  const cropHeight = crop.height / straightenScale;
  const finalWidth = quarterTurn === 90 || quarterTurn === 270 ? cropHeight : cropWidth;
  const finalHeight = quarterTurn === 90 || quarterTurn === 270 ? cropWidth : cropHeight;

  const centerX = imageSize.width / 2;
  const centerY = imageSize.height / 2;
  const cropCenterX = crop.x + crop.width / 2;
  const cropCenterY = crop.y + crop.height / 2;
  const dx = (cropCenterX - centerX) / straightenScale;
  const dy = (cropCenterY - centerY) / straightenScale;

  let left = target.width / 2 + (dx * centerRotationCos - dy * centerRotationSin) - finalWidth / 2;
  let top = target.height / 2 + (dx * centerRotationSin + dy * centerRotationCos) - finalHeight / 2;

  for (const edit of mirrorEdits) {
    if (edit.parameters.axis === MirrorAxis.Horizontal) {
      left = target.width - left - finalWidth;
    } else if (edit.parameters.axis === MirrorAxis.Vertical) {
      top = target.height - top - finalHeight;
    }
  }

  const width = clamp ? Math.max(1, Math.min(Math.round(finalWidth), target.width)) : finalWidth;
  const height = clamp ? Math.max(1, Math.min(Math.round(finalHeight), target.height)) : finalHeight;

  return {
    left: clamp ? Math.max(0, Math.min(Math.round(left), target.width - width)) : left,
    top: clamp ? Math.max(0, Math.min(Math.round(top), target.height - height)) : top,
    width,
    height,
  };
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
