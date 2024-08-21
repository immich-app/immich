import type { CropSettings } from '$lib/stores/asset-editor.store';
import { get } from 'svelte/store';
import { cropFrame, overlayEl } from './crop-store';

export function draw(crop: CropSettings) {
  const mCropFrame = get(cropFrame);

  if (!mCropFrame) {
    return;
  }

  mCropFrame.style.left = `${crop.x}px`;
  mCropFrame.style.top = `${crop.y}px`;
  mCropFrame.style.width = `${crop.width}px`;
  mCropFrame.style.height = `${crop.height}px`;

  drawOverlay(crop);
}

export function drawOverlay(crop: CropSettings) {
  const overlay = get(overlayEl);
  if (!overlay) {
    return;
  }

  overlay.style.clipPath = `
    polygon(
      0% 0%,
      0% 100%,
      100% 100%,
      100% 0%,
      0% 0%,
      ${crop.x}px ${crop.y}px,
      ${crop.x + crop.width}px ${crop.y}px,
      ${crop.x + crop.width}px ${crop.y + crop.height}px,
      ${crop.x}px ${crop.y + crop.height}px,
      ${crop.x}px ${crop.y}px
    )
  `;
}
