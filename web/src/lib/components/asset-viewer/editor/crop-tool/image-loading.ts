import { cropImageScale, cropImageSize, cropSettings, type CropSettings } from '$lib/stores/asset-editor.store';
import { get } from 'svelte/store';
import { cropAreaEl, cropFrame, imgElement } from './crop-store';
import { draw } from './drawing';

export function onImageLoad(resetSize: boolean = false) {
  const img = get(imgElement);
  const cropArea = get(cropAreaEl);

  if (!cropArea || !img) {
    return;
  }

  const containerWidth = cropArea.clientWidth ?? 0;
  const containerHeight = cropArea.clientHeight ?? 0;

  const scale = calculateScale(img, containerWidth, containerHeight);

  cropImageSize.set([img.width, img.height]);

  if (resetSize) {
    cropSettings.update((crop) => {
      crop.x = 0;
      crop.y = 0;
      crop.width = img.width * scale;
      crop.height = img.height * scale;
      return crop;
    });
  } else {
    const cropFrameEl = get(cropFrame);
    cropFrameEl?.classList.add('transition');
    cropSettings.update((crop) => normalizeCropArea(crop, img, scale));
    cropFrameEl?.classList.add('transition');
    cropFrameEl?.addEventListener('transitionend', () => cropFrameEl?.classList.remove('transition'), {
      passive: true,
    });
  }
  cropImageScale.set(scale);

  img.style.width = `${img.width * scale}px`;
  img.style.height = `${img.height * scale}px`;

  draw(get(cropSettings));
}

export function calculateScale(img: HTMLImageElement, containerWidth: number, containerHeight: number): number {
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

  return scale;
}

export function normalizeCropArea(crop: CropSettings, img: HTMLImageElement, scale: number) {
  const prevScale = get(cropImageScale);
  const scaleRatio = scale / prevScale;

  crop.x *= scaleRatio;
  crop.y *= scaleRatio;
  crop.width *= scaleRatio;
  crop.height *= scaleRatio;

  crop.width = Math.min(crop.width, img.width * scale);
  crop.height = Math.min(crop.height, img.height * scale);
  crop.x = Math.max(0, Math.min(crop.x, img.width * scale - crop.width));
  crop.y = Math.max(0, Math.min(crop.y, img.height * scale - crop.height));

  return crop;
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
