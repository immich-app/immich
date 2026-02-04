import { cancelImageUrl } from '$lib/utils/sw-messaging';
import type { ClassValue } from 'svelte/elements';

/**
 * Converts a ClassValue to a string suitable for className assignment.
 * Handles strings, arrays, and objects similar to how clsx works.
 */
function classValueToString(value: ClassValue | undefined): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => classValueToString(v))
      .filter(Boolean)
      .join(' ');
  }
  // Object/dictionary case
  return Object.entries(value)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(' ');
}

export interface ImageLoaderProperties {
  imgClass?: ClassValue;
  alt?: string;
  draggable?: boolean;
  role?: string;
  style?: string;
  title?: string | null;
  loading?: 'lazy' | 'eager';
  dataAttributes?: Record<string, string>;
}
export interface ImageSourceProperty {
  src: string | undefined;
}
export interface ImageLoaderCallbacks {
  onStart?: () => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onElementCreated?: (element: HTMLImageElement) => void;
}

const updateImageAttributes = (img: HTMLImageElement, params: ImageLoaderProperties) => {
  if (params.alt !== undefined) {
    img.alt = params.alt;
  }
  if (params.draggable !== undefined) {
    img.draggable = params.draggable;
  }
  if (params.imgClass) {
    img.className = classValueToString(params.imgClass);
  }
  if (params.role) {
    img.role = params.role;
  }
  if (params.style !== undefined) {
    img.setAttribute('style', params.style);
  }
  if (params.title !== undefined && params.title !== null) {
    img.title = params.title;
  }
  if (params.loading !== undefined) {
    img.loading = params.loading;
  }
  if (params.dataAttributes) {
    for (const [key, value] of Object.entries(params.dataAttributes)) {
      img.setAttribute(key, value);
    }
  }
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
  onElementCreated?: (imgElement: HTMLImageElement) => void,
) => {
  if (!src) {
    return undefined;
  }
  const img = document.createElement('img');
  updateImageAttributes(img, properties);

  img.addEventListener('load', onLoad);
  img.addEventListener('error', onError);

  onStart?.();

  if (src) {
    img.src = src;
    onElementCreated?.(img);
  }

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
    return () => void 0;
  }
  return () => {
    destroyed = true;
    destroyImageElement(img, src, wrappedOnLoad, wrappedOnError);
  };
}

export type LoadImageFunction = typeof loadImage;

/**
 * 1. Creates and appends an <img> element to the parent
 * 2. Coordinates with service worker before src triggers fetch
 * 3. Adds load/error listeners
 * 4. Cancels SW request when element is removed from DOM
 */
export function imageLoader(
  node: HTMLElement,
  params: ImageSourceProperty & ImageLoaderProperties & ImageLoaderCallbacks,
) {
  let currentSrc = params.src;
  let currentCallbacks = params;
  let imgElement: HTMLImageElement | undefined = undefined;

  const handleLoad = () => {
    currentCallbacks.onLoad?.();
  };

  const handleError = () => {
    currentCallbacks.onError?.(new Error(`Failed to load image: ${currentSrc}`));
  };

  const handleElementCreated = (img: HTMLImageElement) => {
    if (img) {
      node.append(img);
      currentCallbacks.onElementCreated?.(img);
    }
  };

  const createImage = () => {
    imgElement = createImageElement(currentSrc, params, handleLoad, handleError, params.onStart, handleElementCreated);
  };
  createImage();

  return {
    update(newParams: ImageSourceProperty & ImageLoaderProperties & ImageLoaderCallbacks) {
      // If src changed, recreate the image element
      if (newParams.src !== currentSrc) {
        if (imgElement) {
          destroyImageElement(imgElement, currentSrc, handleLoad, handleError);
        }
        currentSrc = newParams.src;
        currentCallbacks = newParams;

        createImage();
        return;
      }

      currentCallbacks = newParams;

      if (!imgElement) {
        return;
      }
      updateImageAttributes(imgElement, newParams);
    },

    destroy() {
      if (imgElement) {
        destroyImageElement(imgElement, currentSrc, handleLoad, handleError);
      }
    },
  };
}
