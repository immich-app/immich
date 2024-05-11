import { photoViewer } from '$lib/stores/assets.store';
import { getAssetThumbnailUrl } from '$lib/utils';
import { AssetTypeEnum, ThumbnailFormat, type AssetFaceResponseDto, type PersonResponseDto } from '@immich/sdk';
import { get } from 'svelte/store';

export const searchNameLocal = (
  name: string,
  people: PersonResponseDto[],
  slice: number,
  personId?: string,
): PersonResponseDto[] => {
  return name.includes(' ')
    ? people
        .filter((person: PersonResponseDto) => {
          return personId
            ? person.name.toLowerCase().startsWith(name.toLowerCase()) && person.id !== personId
            : person.name.toLowerCase().startsWith(name.toLowerCase());
        })
        .slice(0, slice)
    : people
        .filter((person: PersonResponseDto) => {
          const nameParts = person.name.split(' ');
          return personId
            ? nameParts.some((splitName) => splitName.toLowerCase().startsWith(name.toLowerCase())) &&
                person.id !== personId
            : nameParts.some((splitName) => splitName.toLowerCase().startsWith(name.toLowerCase()));
        })
        .slice(0, slice);
};

export const getPersonNameWithHiddenValue = (name: string, isHidden: boolean) => {
  return `${name ? name + (isHidden ? ' ' : '') : ''}${isHidden ? '(hidden)' : ''}`;
};

export const zoomImageToBase64 = async (
  face: AssetFaceResponseDto,
  assetType: AssetTypeEnum,
  assetId: string,
): Promise<string | null> => {
  let image: HTMLImageElement | null = null;
  if (assetType === AssetTypeEnum.Image) {
    image = get(photoViewer);
  } else if (assetType === AssetTypeEnum.Video) {
    const data = getAssetThumbnailUrl(assetId, ThumbnailFormat.Webp);
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
