import { photoViewerId } from '$lib/stores/assets.store';
import type { AssetFaceResponseDto } from '@api';

export const getContainedSize = (img: HTMLImageElement): { width: number; height: number } => {
  let ratio = img.naturalWidth / img.naturalHeight;
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

export const showBoundingBox = (faces: AssetFaceResponseDto[]): HTMLDivElement[] => {
  const boxes: HTMLDivElement[] = [];
  cleanBoundingBox();
  let x = 0;
  let y = 0;
  let clientHeight = 0;
  let clientWidth = 0;
  const image: HTMLImageElement = document.getElementById(photoViewerId) as HTMLImageElement;

  if (image) {
    clientHeight = image.clientHeight;
    clientWidth = image.clientWidth;

    const { width, height } = getContainedSize(image);
    x = width;
    y = height;
  }

  for (let i = 0; i < faces.length; i++) {
    let absoluteDiv = document.createElement('div');

    absoluteDiv.classList.add(boundingBoxClassName);

    let coordinates = {
      x1: (x / faces[i].imageWidth) * faces[i].boundingBoxX1 + (clientWidth - x) / 2,
      x2: (x / faces[i].imageWidth) * faces[i].boundingBoxX2 + (clientWidth - x) / 2,
      y1: (y / faces[i].imageHeight) * faces[i].boundingBoxY1 + (clientHeight - y) / 2,
      y2: (y / faces[i].imageHeight) * faces[i].boundingBoxY2 + (clientHeight - y) / 2,
    };

    absoluteDiv.style.setProperty('position', 'absolute');
    absoluteDiv.style.setProperty('top', coordinates.y1 + 'px');
    absoluteDiv.style.setProperty('left', coordinates.x1 + 'px');
    absoluteDiv.style.setProperty('width', coordinates.x2 - coordinates.x1 + 'px');
    absoluteDiv.style.setProperty('height', coordinates.y2 - coordinates.y1 + 'px');
    absoluteDiv.style.setProperty('border-color', 'rgb(255 255 255)');
    absoluteDiv.style.setProperty('border-width', '2px');
    absoluteDiv.style.setProperty('border-radius', '0.75rem');
    boxes.push(absoluteDiv);
  }
  return boxes;
};
