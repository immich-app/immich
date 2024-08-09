import { cropImageScale, cropImageSize, cropSettings } from '$lib/stores/asset-editor.store';
import { get } from 'svelte/store';
import { cropAreaEl, imgElement } from './crop-store';
import { draw } from './drawing';

export function onImageLoad() {
  const img = get(imgElement);
  const cropArea = get(cropAreaEl);

  if (!cropArea || !img) {
    return;
  }

  const containerWidth = cropArea?.clientWidth ?? 0;
  const containerHeight = cropArea?.clientHeight ?? 0;
  const imageAspectRatio = img.width / img.height;

  let scale: number;
  if (imageAspectRatio > 1) {
    scale = containerWidth / img.width;
    if (img.height * scale > containerHeight) {
      scale = containerHeight / img.height;
    }
  } else {
    scale = containerHeight / img.height;
    if (img.width * scale > containerWidth) {
      scale = containerWidth / img.width;
    }
  }
  cropImageSize.set([img.width, img.height]);
  cropImageScale.set(scale);

  cropSettings.update((crop) => {
    crop.x = 0;
    crop.y = 0;
    crop.width = img.width * scale - 1;
    crop.height = img.height * scale - 1;
    return crop;
  });

  img.style.width = `${img.width * scale}px`;
  img.style.height = `${img.height * scale}px`;

  draw(get(cropSettings));
}

export function resizeCanvas() {
  const img = get(imgElement);
  const cropArea = get(cropAreaEl);

  if (!cropArea || !img) {
    return;
  }

  const containerWidth = cropArea?.clientWidth ?? 0;
  const containerHeight = cropArea?.clientHeight ?? 0;
  const imageAspectRatio = img.width / img.height;

  let scale;
  if (imageAspectRatio > 1) {
    scale = containerWidth / img.width;
    if (img.height * scale > containerHeight) {
      scale = containerHeight / img.height;
    }
  } else {
    scale = containerHeight / img.height;
    if (img.width * scale > containerWidth) {
      scale = containerWidth / img.width;
    }
  }

  img.style.width = `${img.width * scale}px`;
  img.style.height = `${img.height * scale}px`;

  const cropFrame = cropArea.querySelector('.crop-frame') as HTMLElement;
  if (cropFrame) {
    cropFrame.style.width = `${img.width * scale}px`;
    cropFrame.style.height = `${img.height * scale}px`;
  }

  draw(get(cropSettings));
}
