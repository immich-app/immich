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

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface BoundingBoxCoordinates {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Calculate display bounding boxes with zoom and pan support
 * @param items Array of items with bounding box coordinates
 * @param zoom Current zoom state
 * @param photoViewer The image element
 * @returns Array of calculated bounding boxes ready for display
 */
export const calculateBoundingBoxes = <T extends BoundingBoxCoordinates>(
  items: T[],
  zoom: ZoomImageWheelState,
  photoViewer: HTMLImageElement | null,
): (BoundingBox & { item: T })[] => {
  const boxes: (BoundingBox & { item: T })[] = [];

  if (photoViewer === null) {
    return boxes;
  }

  const clientHeight = photoViewer.clientHeight;
  const clientWidth = photoViewer.clientWidth;
  const { width, height } = getContainedSize(photoViewer);

  for (const item of items) {
    // Create the coordinates of the box based on the displayed image.
    // The coordinates must take into account margins due to the 'object-fit: contain;' css property of the photo-viewer.
    const coordinates = {
      x1:
        (width / item.imageWidth) * zoom.currentZoom * item.x1 +
        ((clientWidth - width) / 2) * zoom.currentZoom +
        zoom.currentPositionX,
      x2:
        (width / item.imageWidth) * zoom.currentZoom * item.x2 +
        ((clientWidth - width) / 2) * zoom.currentZoom +
        zoom.currentPositionX,
      y1:
        (height / item.imageHeight) * zoom.currentZoom * item.y1 +
        ((clientHeight - height) / 2) * zoom.currentZoom +
        zoom.currentPositionY,
      y2:
        (height / item.imageHeight) * zoom.currentZoom * item.y2 +
        ((clientHeight - height) / 2) * zoom.currentZoom +
        zoom.currentPositionY,
    };

    boxes.push({
      top: Math.round(coordinates.y1),
      left: Math.round(coordinates.x1),
      width: Math.round(coordinates.x2 - coordinates.x1),
      height: Math.round(coordinates.y2 - coordinates.y1),
      item,
    });
  }

  return boxes;
};
