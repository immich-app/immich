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
