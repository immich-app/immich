import type { OcrBoundingBox } from '$lib/stores/ocr.svelte';
import type { ContentMetrics } from '$lib/utils/container-utils';

export type Point = {
  x: number;
  y: number;
};

export interface OcrBox {
  id: string;
  points: Point[];
  text: string;
  confidence: number;
}

/**
 * Calculate bounding box transform from OCR points. Result matrix can be used as input for css matrix3d.
 * @param points - Array of 4 corner points of the bounding box
 * @returns 4x4 matrix to transform the div with text onto the polygon defined by the corner points, and size to set on the source div.
 */
export const calculateBoundingBoxMatrix = (points: Point[]): { matrix: number[]; width: number; height: number } => {
  const [topLeft, topRight, bottomRight, bottomLeft] = points;

  // Approximate width and height to prevent text distortion as much as possible
  const distance = (p1: Point, p2: Point) => Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const width = Math.max(distance(topLeft, topRight), distance(bottomLeft, bottomRight));
  const height = Math.max(distance(topLeft, bottomLeft), distance(topRight, bottomRight));

  const dx1 = topRight.x - bottomRight.x;
  const dx2 = bottomLeft.x - bottomRight.x;
  const dx3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;

  const dy1 = topRight.y - bottomRight.y;
  const dy2 = bottomLeft.y - bottomRight.y;
  const dy3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;

  const det = dx1 * dy2 - dx2 * dy1;
  const a13 = (dx3 * dy2 - dx2 * dy3) / det;
  const a23 = (dx1 * dy3 - dx3 * dy1) / det;

  const a11 = (1 + a13) * topRight.x - topLeft.x;
  const a21 = (1 + a23) * bottomLeft.x - topLeft.x;

  const a12 = (1 + a13) * topRight.y - topLeft.y;
  const a22 = (1 + a23) * bottomLeft.y - topLeft.y;

  // prettier-ignore
  const matrix = [
    a11 / width, a12 / width, 0, a13 / width,
    a21 / height, a22 / height, 0, a23 / height,
    0, 0, 1, 0,
    topLeft.x, topLeft.y, 0, 1,
  ];

  return { matrix, width, height };
};

export const getOcrBoundingBoxes = (ocrData: OcrBoundingBox[], metrics: ContentMetrics): OcrBox[] => {
  const boxes: OcrBox[] = [];
  for (const ocr of ocrData) {
    const points = [
      { x: ocr.x1, y: ocr.y1 },
      { x: ocr.x2, y: ocr.y2 },
      { x: ocr.x3, y: ocr.y3 },
      { x: ocr.x4, y: ocr.y4 },
    ].map((point) => ({
      x: point.x * metrics.contentWidth + metrics.offsetX,
      y: point.y * metrics.contentHeight + metrics.offsetY,
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
