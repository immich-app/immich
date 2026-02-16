import { cancelImageUrl } from '$lib/utils/sw-messaging';

type ImageLoaderProperties = {
  alt?: string;
  draggable?: boolean;
  loading?: 'lazy' | 'eager';
};

const destroyImageElement = (
  imgElement: HTMLImageElement,
  currentSrc: string | undefined,
  handleLoad: () => void,
  handleError: () => void,
) => {
  imgElement.removeEventListener('load', handleLoad);
  imgElement.removeEventListener('error', handleError);
  cancelImageUrl(currentSrc);
  imgElement.remove();
};

const createImageElement = (
  src: string | undefined,
  properties: ImageLoaderProperties,
  onLoad: () => void,
  onError: () => void,
  onStart?: () => void,
) => {
  if (!src) {
    return undefined;
  }
  const img = document.createElement('img');

  if (properties.alt !== undefined) {
    img.alt = properties.alt;
  }
  if (properties.draggable !== undefined) {
    img.draggable = properties.draggable;
  }
  if (properties.loading !== undefined) {
    img.loading = properties.loading;
  }

  img.addEventListener('load', onLoad);
  img.addEventListener('error', onError);

  onStart?.();
  img.src = src;

  return img;
};

export function loadImage(
  src: string,
  properties: ImageLoaderProperties,
  onLoad: () => void,
  onError: () => void,
  onStart?: () => void,
) {
  let destroyed = false;
  const wrapper = (fn: (() => void) | undefined) => () => {
    if (destroyed) {
      return;
    }
    fn?.();
  };
  const wrappedOnLoad = wrapper(onLoad);
  const wrappedOnError = wrapper(onError);
  const wrappedOnStart = wrapper(onStart);
  const img = createImageElement(src, properties, wrappedOnLoad, wrappedOnError, wrappedOnStart);
  if (!img) {
    return () => {};
  }
  return () => {
    destroyed = true;
    destroyImageElement(img, src, wrappedOnLoad, wrappedOnError);
  };
}

export type LoadImageFunction = typeof loadImage;
