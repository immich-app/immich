import { photoViewerId } from '$lib/stores/assets.store';
import type { AssetFaceWithoutPersonResponseDto } from '@api';

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

export const showBoundingBox = (faces: AssetFaceWithoutPersonResponseDto[]): HTMLDivElement[] => {
  const boxes: HTMLDivElement[] = [];
  cleanBoundingBox();

  const image: HTMLImageElement = document.getElementById(photoViewerId) as HTMLImageElement;

  if (image === null) {
    return boxes;
  }
  const clientHeight = image.clientHeight;
  const clientWidth = image.clientWidth;

  const { width, height } = getContainedSize(image);
  const x = width;
  const y = height;
  for (const face of faces) {
    const absoluteDiv = document.createElement('div');

    absoluteDiv.classList.add(boundingBoxClassName);

    const coordinates = {
      x1: (x / face.imageWidth) * face.boundingBoxX1 + (clientWidth - x) / 2,
      x2: (x / face.imageWidth) * face.boundingBoxX2 + (clientWidth - x) / 2,
      y1: (y / face.imageHeight) * face.boundingBoxY1 + (clientHeight - y) / 2,
      y2: (y / face.imageHeight) * face.boundingBoxY2 + (clientHeight - y) / 2,
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
