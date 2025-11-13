import type { AssetOcrResponseDto } from '@immich/sdk';
import type { ZoomImageWheelState } from '@zoom-image/core';
import { calculateBoundingBoxes, type BoundingBoxCoordinates } from './bounding-box-utils';

export interface OcrBoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
  text: string;
  boxScore: number;
  textScore: number;
}

/**
 * Convert OCR data to normalized bounding box coordinates
 * OCR coordinates are normalized (0-1) and have 4 corners, so we need to convert them
 */
const ocrToCoordinates = (ocr: AssetOcrResponseDto, imageWidth: number, imageHeight: number): BoundingBoxCoordinates => {
  // OCR box has 4 corners: (x1,y1), (x2,y2), (x3,y3), (x4,y4)
  // For simplicity, we'll create a bounding rectangle from min/max coordinates
  const x1 = ocr.x1 * imageWidth;
  const x2 = ocr.x2 * imageWidth;
  const x3 = ocr.x3 * imageWidth;
  const x4 = ocr.x4 * imageWidth;
  const y1 = ocr.y1 * imageHeight;
  const y2 = ocr.y2 * imageHeight;
  const y3 = ocr.y3 * imageHeight;
  const y4 = ocr.y4 * imageHeight;

  return {
    x1: Math.min(x1, x2, x3, x4),
    x2: Math.max(x1, x2, x3, x4),
    y1: Math.min(y1, y2, y3, y4),
    y2: Math.max(y1, y2, y3, y4),
    imageWidth,
    imageHeight,
  };
};

export const getOcrBoundingBox = (
  ocrData: AssetOcrResponseDto[],
  zoom: ZoomImageWheelState,
  photoViewer: HTMLImageElement | null,
): OcrBoundingBox[] => {
  if (photoViewer === null) {
    return [];
  }

  const imageWidth = photoViewer.naturalWidth;
  const imageHeight = photoViewer.naturalHeight;

  const normalizedOcrData = ocrData.map((ocr) => ({
    ...ocrToCoordinates(ocr, imageWidth, imageHeight),
    ocr,
  }));

  const boxes = calculateBoundingBoxes(normalizedOcrData, zoom, photoViewer);

  return boxes.map((box) => ({
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
    text: box.item.ocr.text,
    boxScore: box.item.ocr.boxScore,
    textScore: box.item.ocr.textScore,
  }));
};
