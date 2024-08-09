import { cropImageScale, cropImageSize, cropSettings } from '$lib/stores/asset-editor.store';
import { get } from 'svelte/store';
import { draw } from './canvas-drawing';
import { canvasElement, context2D, imgElement, padding } from './crop-store';

const mPadding = get(padding);
export function onImageLoad() {
  const img = get(imgElement);
  const canvas = get(canvasElement);
  let ctx = get(context2D);

  if (!canvas || !img) {
    return;
  }

  if (!ctx) {
    ctx = canvas.getContext('2d');
    context2D.set(ctx);
  }

  resizeCanvas();

  const containerWidth = canvas.parentElement?.clientWidth ?? 0;
  const containerHeight = canvas.parentElement?.clientHeight ?? 0;
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

  draw(canvas, get(cropSettings));
}

export function resizeCanvas() {
  const img = get(imgElement);
  const canvas = get(canvasElement);
  if (!canvas || !img) {
    return;
  }

  const containerWidth = canvas.parentElement?.clientWidth ?? 0;
  const containerHeight = canvas.parentElement?.clientHeight ?? 0;
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

  canvas.width = img.width * scale + 2 * mPadding;
  canvas.height = img.height * scale + 2 * mPadding;

  draw(canvas, get(cropSettings));
}
