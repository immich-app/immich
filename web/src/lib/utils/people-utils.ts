import type { Faces } from '$lib/stores/people.store';
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

export interface boundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const getBoundingBox = (
  faces: Faces[],
  zoom: ZoomImageWheelState,
  photoViewer: HTMLImageElement | null,
): boundingBox[] => {
  const boxes: boundingBox[] = [];

  if (photoViewer === null) {
    return boxes;
  }
  const clientHeight = photoViewer.clientHeight;
  const clientWidth = photoViewer.clientWidth;

  const { width, height } = getContainedSize(photoViewer);

  for (const face of faces) {
    /*
     *
     * Create the coordinates of the box based on the displayed image.
     * The coordinates must take into account margins due to the 'object-fit: contain;' css property of the photo-viewer.
     *
     */
    const coordinates = {
      x1:
        (width / face.imageWidth) * zoom.currentZoom * face.boundingBoxX1 +
        ((clientWidth - width) / 2) * zoom.currentZoom +
        zoom.currentPositionX,
      x2:
        (width / face.imageWidth) * zoom.currentZoom * face.boundingBoxX2 +
        ((clientWidth - width) / 2) * zoom.currentZoom +
        zoom.currentPositionX,
      y1:
        (height / face.imageHeight) * zoom.currentZoom * face.boundingBoxY1 +
        ((clientHeight - height) / 2) * zoom.currentZoom +
        zoom.currentPositionY,
      y2:
        (height / face.imageHeight) * zoom.currentZoom * face.boundingBoxY2 +
        ((clientHeight - height) / 2) * zoom.currentZoom +
        zoom.currentPositionY,
    };

    boxes.push({
      top: Math.round(coordinates.y1),
      left: Math.round(coordinates.x1),
      width: Math.round(coordinates.x2 - coordinates.x1),
      height: Math.round(coordinates.y2 - coordinates.y1),
    });
  }
  return boxes;
};
