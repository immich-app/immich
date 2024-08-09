import type { CropAspectRatio, CropSettings } from '$lib/stores/asset-editor.store';
import { get } from 'svelte/store';
import { padding } from './crop-store';
import { checkEdits } from './mouse-handlers';

const mPadding = get(padding);
export function recalculateCrop(
  crop: CropSettings,
  canvas: HTMLCanvasElement,
  aspectRatio: CropAspectRatio,
  returnNewCrop = false,
): CropSettings | null {
  if (!canvas) {
    return null;
  }
  const { width, height, x, y } = crop;
  let newWidth = width;
  let newHeight = height;
  const canvasW = canvas.width - mPadding * 2;
  const canvasH = canvas.height - mPadding * 2;

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
  newWidth -= 1;
  newHeight -= 1;

  const newCrop = {
    width: newWidth,
    height: newHeight,
    x: Math.max(0, x + (width - newWidth) / 2),
    y: Math.max(0, y + (height - newHeight) / 2),
  };

  if (newCrop.x + newWidth > canvasW) {
    newCrop.x = canvasW - newWidth;
  }
  if (newCrop.y + newHeight > canvasH) {
    newCrop.y = canvasH - newHeight;
  }

  if (returnNewCrop) {
    setTimeout(() => {
      checkEdits();
    }, 1);
    return newCrop;
  } else {
    crop.width = newWidth;
    crop.height = newHeight;
    crop.x = newCrop.x;
    crop.y = newCrop.y;
    return null;
  }
}

export function animateCropChange(crop: CropSettings, newCrop: CropSettings, draw: () => void, duration = 100) {
  if (!newCrop) {
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
) {
  let w = newWidth,
    h = newHeight;

  let aspectMultiplier;

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

  return { newWidth: w, newHeight: h };
}
