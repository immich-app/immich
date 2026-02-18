import type { Faces } from '$lib/stores/people.store';
import { getAssetMediaUrl } from '$lib/utils';
import type { DisplayMetrics } from '$lib/utils/container-utils';
import { AssetTypeEnum, type AssetFaceResponseDto } from '@immich/sdk';

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const getBoundingBox = (faces: Faces[], metrics: DisplayMetrics): BoundingBox[] => {
  const boxes: BoundingBox[] = [];

  for (const face of faces) {
    const scaleX = metrics.displayWidth / face.imageWidth;
    const scaleY = metrics.displayHeight / face.imageHeight;

    const coordinates = {
      x1: scaleX * face.boundingBoxX1 + metrics.offsetX,
      x2: scaleX * face.boundingBoxX2 + metrics.offsetX,
      y1: scaleY * face.boundingBoxY1 + metrics.offsetY,
      y2: scaleY * face.boundingBoxY2 + metrics.offsetY,
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

export const zoomImageToBase64 = async (
  face: AssetFaceResponseDto,
  assetId: string,
  assetType: AssetTypeEnum,
  photoViewer: HTMLImageElement | undefined,
): Promise<string | null> => {
  let image: HTMLImageElement | undefined;
  if (assetType === AssetTypeEnum.Image) {
    image = photoViewer;
  } else if (assetType === AssetTypeEnum.Video) {
    const data = getAssetMediaUrl({ id: assetId });
    const img: HTMLImageElement = new Image();
    img.src = data;

    await new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve());
      img.addEventListener('error', () => resolve());
    });

    image = img;
  }
  if (!image) {
    return null;
  }
  const { boundingBoxX1: x1, boundingBoxX2: x2, boundingBoxY1: y1, boundingBoxY2: y2, imageWidth, imageHeight } = face;

  const coordinates = {
    x1: (image.naturalWidth / imageWidth) * x1,
    x2: (image.naturalWidth / imageWidth) * x2,
    y1: (image.naturalHeight / imageHeight) * y1,
    y2: (image.naturalHeight / imageHeight) * y2,
  };

  const faceWidth = coordinates.x2 - coordinates.x1;
  const faceHeight = coordinates.y2 - coordinates.y1;

  const faceImage = new Image();
  faceImage.src = image.src;

  await new Promise((resolve) => {
    faceImage.addEventListener('load', resolve);
    faceImage.addEventListener('error', () => resolve(null));
  });

  const canvas = document.createElement('canvas');
  canvas.width = faceWidth;
  canvas.height = faceHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  context.drawImage(faceImage, coordinates.x1, coordinates.y1, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);
  return canvas.toDataURL();
};
