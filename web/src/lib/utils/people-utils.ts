import { photoViewerId } from '$lib/stores/assets.store';
import type { Faces } from '$lib/stores/people.store';
import type { ZoomImageWheelState } from '@zoom-image/core';

export const getContainedSize = (img: HTMLImageElement): { width: number; height: number } => {
  const ratio = img.naturalWidth / img.naturalHeight;
  let width = img.height * ratio;
  let height = img.height;
  if (width > img.width) {
    width = img.width;
    height = img.width / ratio;
  }
  return { width, height };
};

export const boundingBoxClassName = 'boundingBox';

export const cleanBoundingBox = (): void => {
  const get = Array.from(document.getElementsByClassName(boundingBoxClassName));
  get.forEach((element) => {
    element.remove();
  });
};

export const showBoundingBox = (faces: Faces[], zoom: ZoomImageWheelState): HTMLDivElement[] => {
  const boxes: HTMLDivElement[] = [];
  cleanBoundingBox();
  const image: HTMLImageElement = document.getElementById(photoViewerId) as HTMLImageElement;

  if (image === null) {
    return boxes;
  }
  const clientHeight = image.clientHeight;
  const clientWidth = image.clientWidth;

  const { width, height } = getContainedSize(image);

  for (const face of faces) {
    const absoluteDiv = document.createElement('div');

    absoluteDiv.classList.add(boundingBoxClassName);

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
    const styles = {
      position: 'absolute',
      top: coordinates.y1 + 'px',
      left: coordinates.x1 + 'px',
      width: coordinates.x2 - coordinates.x1 + 'px',
      height: coordinates.y2 - coordinates.y1 + 'px',
      borderColor: 'rgb(255, 255, 255)',
      borderWidth: '3px',
      borderRadius: '0.75rem',
    };

    Object.assign(absoluteDiv.style, styles);
    boxes.push(absoluteDiv);
  }
  return boxes;
};
