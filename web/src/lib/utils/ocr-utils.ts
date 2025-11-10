import type { OcrBoundingBox } from '$lib/stores/ocr.svelte';
import type { ZoomImageWheelState } from '@zoom-image/core';

const getContainedSize = (img: HTMLImageElement): { width: number; height: number } => {
  const ratio = img.naturalWidth / img.naturalHeight;
  let width = img.height * ratio;
  let height = img.height;
  if (width > img.width) {
    width = img.width;
    height = img.width / ratio;
  }
  return { width, height };
};

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
  pathData: string;
}

/**
 * Calculate bounding box dimensions and properties from OCR points
 * @param points - Array of 4 corner points of the bounding box
 * @returns Dimensions, rotation, and SVG path data for the bounding box
 */
export const calculateBoundingBoxDimensions = (points: { x: number; y: number }[]): BoundingBoxDimensions => {
  const minX = Math.min(...points.map(({ x }) => x));
  const maxX = Math.max(...points.map(({ x }) => x));
  const minY = Math.min(...points.map(({ y }) => y));
  const maxY = Math.max(...points.map(({ y }) => y));
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Calculate rotation angle from the bottom edge (points[3] to points[2])
  const rotation = Math.atan2(points[2].y - points[3].y, points[2].x - points[3].x) * (180 / Math.PI);

  // Create SVG path data for the quadrilateral
  const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;

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
    pathData,
  };
};

/**
 * Convert normalized OCR coordinates to screen coordinates
 * OCR coordinates are normalized (0-1) and represent the 4 corners of a rotated rectangle
 */
export const getOcrBoundingBoxes = (
  ocrData: OcrBoundingBox[],
  zoom: ZoomImageWheelState,
  photoViewer: HTMLImageElement | null,
): OcrBox[] => {
  const boxes: OcrBox[] = [];

  if (photoViewer === null || !photoViewer.naturalWidth || !photoViewer.naturalHeight) {
    return boxes;
  }

  const clientHeight = photoViewer.clientHeight;
  const clientWidth = photoViewer.clientWidth;
  const { width, height } = getContainedSize(photoViewer);

  const imageWidth = photoViewer.naturalWidth;
  const imageHeight = photoViewer.naturalHeight;

  for (const ocr of ocrData) {
    // Convert normalized coordinates (0-1) to actual pixel positions
    // OCR provides 4 corners of a potentially rotated rectangle
    const points = [
      { x: ocr.x1, y: ocr.y1 },
      { x: ocr.x2, y: ocr.y2 },
      { x: ocr.x3, y: ocr.y3 },
      { x: ocr.x4, y: ocr.y4 },
    ].map((point) => ({
      x:
        (width / imageWidth) * zoom.currentZoom * point.x * imageWidth +
        ((clientWidth - width) / 2) * zoom.currentZoom +
        zoom.currentPositionX,
      y:
        (height / imageHeight) * zoom.currentZoom * point.y * imageHeight +
        ((clientHeight - height) / 2) * zoom.currentZoom +
        zoom.currentPositionY,
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
