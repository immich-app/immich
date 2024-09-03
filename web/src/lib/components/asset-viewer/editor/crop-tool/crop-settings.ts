import type { CropAspectRatio, CropSettings } from '$lib/stores/asset-editor.store';
import { get } from 'svelte/store';
import { cropAreaEl } from './crop-store';
import { checkEdits } from './mouse-handlers';

export function recalculateCrop(
  crop: CropSettings,
  canvas: HTMLElement,
  aspectRatio: CropAspectRatio,
  returnNewCrop = false,
): CropSettings | null {
  const canvasW = canvas.clientWidth;
  const canvasH = canvas.clientHeight;

  let newWidth = crop.width;
  let newHeight = crop.height;

  const { newWidth: w, newHeight: h } = keepAspectRatio(newWidth, newHeight, aspectRatio);

  if (w > canvasW) {
    newWidth = canvasW;
    newHeight = canvasW / (w / h);
  } else if (h > canvasH) {
    newHeight = canvasH;
    newWidth = canvasH * (w / h);
  } else {
    newWidth = w;
    newHeight = h;
  }

  const newX = Math.max(0, Math.min(crop.x, canvasW - newWidth));
  const newY = Math.max(0, Math.min(crop.y, canvasH - newHeight));

  const newCrop = {
    width: newWidth,
    height: newHeight,
    x: newX,
    y: newY,
  };

  if (returnNewCrop) {
    setTimeout(() => {
      checkEdits();
    }, 1);
    return newCrop;
  } else {
    crop.width = newWidth;
    crop.height = newHeight;
    crop.x = newX;
    crop.y = newY;
    return null;
  }
}

export function animateCropChange(crop: CropSettings, newCrop: CropSettings, draw: () => void, duration = 100) {
  const cropArea = get(cropAreaEl);
  if (!cropArea) {
    return;
  }

  const cropFrame = cropArea.querySelector('.crop-frame') as HTMLElement;
  if (!cropFrame) {
    return;
  }

  const startTime = performance.now();
  const initialCrop = { ...crop };

  const animate = (currentTime: number) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    crop.x = initialCrop.x + (newCrop.x - initialCrop.x) * progress;
    crop.y = initialCrop.y + (newCrop.y - initialCrop.y) * progress;
    crop.width = initialCrop.width + (newCrop.width - initialCrop.width) * progress;
    crop.height = initialCrop.height + (newCrop.height - initialCrop.height) * progress;

    draw();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

export function keepAspectRatio(newWidth: number, newHeight: number, aspectRatio: CropAspectRatio) {
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

  if (widthRatio && heightRatio) {
    const calculatedWidth = (newHeight * widthRatio) / heightRatio;
    return { newWidth: calculatedWidth, newHeight };
  }

  return { newWidth, newHeight };
}

export function adjustDimensions(
  newWidth: number,
  newHeight: number,
  aspectRatio: CropAspectRatio,
  xLimit: number,
  yLimit: number,
  minSize: number,
) {
  let w = newWidth;
  let h = newHeight;

  let aspectMultiplier: number;

  if (aspectRatio === 'free') {
    aspectMultiplier = newWidth / newHeight;
  } else {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
    aspectMultiplier = widthRatio && heightRatio ? widthRatio / heightRatio : newWidth / newHeight;
  }

  if (aspectRatio !== 'free') {
    h = w / aspectMultiplier;
  }

  if (w > xLimit) {
    w = xLimit;
    if (aspectRatio !== 'free') {
      h = w / aspectMultiplier;
    }
  }
  if (h > yLimit) {
    h = yLimit;
    if (aspectRatio !== 'free') {
      w = h * aspectMultiplier;
    }
  }

  if (w < minSize) {
    w = minSize;
    if (aspectRatio !== 'free') {
      h = w / aspectMultiplier;
    }
  }
  if (h < minSize) {
    h = minSize;
    if (aspectRatio !== 'free') {
      w = h * aspectMultiplier;
    }
  }

  if (aspectRatio !== 'free' && w / h !== aspectMultiplier) {
    if (w < minSize) {
      h = w / aspectMultiplier;
    }
    if (h < minSize) {
      w = h * aspectMultiplier;
    }
  }

  return { newWidth: w, newHeight: h };
}
