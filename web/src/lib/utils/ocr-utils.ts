import type { OcrBoundingBox } from '$lib/stores/ocr.svelte';

export interface OcrBox {
  id: string;
  points: { x: number; y: number }[];
  text: string;
  confidence: number;
}

export interface BoundingBoxDimensions {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  rotation: number;
  skewX: number;
  skewY: number;
}

/**
 * Calculate bounding box dimensions and properties from OCR points
 * @param points - Array of 4 corner points of the bounding box
 * @returns Dimensions, rotation, and skew values for the bounding box
 */
export const calculateBoundingBoxDimensions = (points: { x: number; y: number }[]): BoundingBoxDimensions => {
  const [topLeft, topRight, bottomRight, bottomLeft] = points;
  const minX = Math.min(...points.map(({ x }) => x));
  const maxX = Math.max(...points.map(({ x }) => x));
  const minY = Math.min(...points.map(({ y }) => y));
  const maxY = Math.max(...points.map(({ y }) => y));
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Calculate rotation angle from the bottom edge (bottomLeft to bottomRight)
  const rotation = Math.atan2(bottomRight.y - bottomLeft.y, bottomRight.x - bottomLeft.x) * (180 / Math.PI);

  // Calculate skew angles to handle perspective distortion
  // SkewX: compare left and right edges
  const leftEdgeAngle = Math.atan2(bottomLeft.y - topLeft.y, bottomLeft.x - topLeft.x);
  const rightEdgeAngle = Math.atan2(bottomRight.y - topRight.y, bottomRight.x - topRight.x);
  const skewX = (rightEdgeAngle - leftEdgeAngle) * (180 / Math.PI);

  // SkewY: compare top and bottom edges
  const topEdgeAngle = Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x);
  const bottomEdgeAngle = Math.atan2(bottomRight.y - bottomLeft.y, bottomRight.x - bottomLeft.x);
  const skewY = (bottomEdgeAngle - topEdgeAngle) * (180 / Math.PI);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX,
    centerY,
    rotation,
    skewX,
    skewY,
  };
};

/**
 * Convert normalized OCR coordinates to screen coordinates
 * OCR coordinates are normalized (0-1) and represent the 4 corners of a rotated rectangle
 */
export const getOcrBoundingBoxes = (
  ocrData: OcrBoundingBox[],
  containerSize: { height: number; width: number },
): OcrBox[] => {
  const boxes: OcrBox[] = [];

  const displayWidth = containerSize.width;
  const displayHeight = containerSize.height;

  for (const ocr of ocrData) {
    // Convert normalized coordinates (0-1) to displayed pixel positions
    // OCR provides 4 corners of a potentially rotated rectangle
    const points = [
      { x: ocr.x1, y: ocr.y1 },
      { x: ocr.x2, y: ocr.y2 },
      { x: ocr.x3, y: ocr.y3 },
      { x: ocr.x4, y: ocr.y4 },
    ].map((point) => ({
      x: point.x * displayWidth,
      y: point.y * displayHeight,
    }));

    boxes.push({
      id: ocr.id,
      points,
      text: ocr.text,
      confidence: ocr.textScore,
    });
  }

  return boxes;
};
