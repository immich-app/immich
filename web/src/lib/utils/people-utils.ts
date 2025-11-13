import type { Faces } from '$lib/stores/people.store';
import { getAssetThumbnailUrl } from '$lib/utils';
import { AssetTypeEnum, type AssetFaceResponseDto } from '@immich/sdk';
import type { ZoomImageWheelState } from '@zoom-image/core';
import { calculateBoundingBoxes, type BoundingBox, type BoundingBoxCoordinates } from './bounding-box-utils';

/**
 * Convert face data to normalized bounding box coordinates
 */
const faceToCoordinates = (face: Faces): BoundingBoxCoordinates => ({
  x1: face.boundingBoxX1,
  x2: face.boundingBoxX2,
  y1: face.boundingBoxY1,
  y2: face.boundingBoxY2,
  imageWidth: face.imageWidth,
  imageHeight: face.imageHeight,
});

export const getFaceBoundingBox = (
  faces: Faces[],
  zoom: ZoomImageWheelState,
  photoViewer: HTMLImageElement | null,
): BoundingBox[] => {
  if (photoViewer === null) {
    return [];
  }

  const normalizedFaces = faces.map(faceToCoordinates);

  return calculateBoundingBoxes(normalizedFaces, zoom, photoViewer);
};

export const zoomImageToBase64 = async (
  face: AssetFaceResponseDto,
  assetId: string,
  assetType: AssetTypeEnum,
  photoViewer: HTMLImageElement | null,
): Promise<string | null> => {
  let image: HTMLImageElement | null = null;
  if (assetType === AssetTypeEnum.Image) {
    image = photoViewer;
  } else if (assetType === AssetTypeEnum.Video) {
    const data = getAssetThumbnailUrl(assetId);
    const img: HTMLImageElement = new Image();
    img.src = data;

    await new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve());
      img.addEventListener('error', () => resolve());
    });

    image = img;
  }
  if (image === null) {
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
  if (context) {
    context.drawImage(faceImage, coordinates.x1, coordinates.y1, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);

    return canvas.toDataURL();
  } else {
    return null;
  }
};
