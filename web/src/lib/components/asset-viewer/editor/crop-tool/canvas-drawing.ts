import type { CropSettings } from '$lib/stores/asset-editor.store';
import { get } from 'svelte/store';
import { context2D, darkenLevel, imgElement, isResizingOrDragging, padding } from './crop-store';
const mPadding = get(padding);
export function draw(canvas: HTMLCanvasElement | null, crop: CropSettings) {
  const ctx = get(context2D);
  const img = get(imgElement);
  if (!ctx || !canvas || !img) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, mPadding, mPadding, canvas.width - 2 * mPadding, canvas.height - 2 * mPadding);
  drawOverlay(canvas, crop);
  drawCropRect(crop);
}

export function drawCropRect(crop: CropSettings) {
  const ctx = get(context2D);
  if (!ctx) {
    return;
  }

  ctx.globalCompositeOperation = 'exclusion';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(crop.x + mPadding, crop.y + mPadding, crop.width, crop.height);

  if (get(isResizingOrDragging)) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    const thirdWidth = crop.width / 3;
    ctx.beginPath();
    ctx.moveTo(crop.x + thirdWidth + mPadding, crop.y + mPadding);
    ctx.lineTo(crop.x + thirdWidth + mPadding, crop.y + crop.height + mPadding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(crop.x + 2 * thirdWidth + mPadding, crop.y + mPadding);
    ctx.lineTo(crop.x + 2 * thirdWidth + mPadding, crop.y + crop.height + mPadding);
    ctx.stroke();

    const thirdHeight = crop.height / 3;
    ctx.beginPath();
    ctx.moveTo(crop.x + mPadding, crop.y + thirdHeight + mPadding);
    ctx.lineTo(crop.x + crop.width + mPadding, crop.y + thirdHeight + mPadding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(crop.x + mPadding, crop.y + 2 * thirdHeight + mPadding);
    ctx.lineTo(crop.x + crop.width + mPadding, crop.y + 2 * thirdHeight + mPadding);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
  //dynamic corners size
  const minSide = Math.min(crop.height, crop.width);
  const length = minSide > 18 * 5 ? 18 : Math.min(18, minSide / 5);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = mPadding * 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(crop.x + mPadding, crop.y + mPadding);
  ctx.lineTo(crop.x + mPadding + length, crop.y + mPadding);
  ctx.moveTo(crop.x + mPadding, crop.y + mPadding);
  ctx.lineTo(crop.x + mPadding, crop.y + mPadding + length);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(crop.x + crop.width + mPadding, crop.y + mPadding);
  ctx.lineTo(crop.x + crop.width + mPadding - length, crop.y + mPadding);
  ctx.moveTo(crop.x + crop.width + mPadding, crop.y + mPadding);
  ctx.lineTo(crop.x + crop.width + mPadding, crop.y + mPadding + length);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(crop.x + mPadding, crop.y + crop.height + mPadding);
  ctx.lineTo(crop.x + mPadding + length, crop.y + crop.height + mPadding);
  ctx.moveTo(crop.x + mPadding, crop.y + crop.height + mPadding);
  ctx.lineTo(crop.x + mPadding, crop.y + crop.height + mPadding - length);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(crop.x + crop.width + mPadding, crop.y + crop.height + mPadding);
  ctx.lineTo(crop.x + crop.width + mPadding - length, crop.y + crop.height + mPadding);
  ctx.moveTo(crop.x + crop.width + mPadding, crop.y + crop.height + mPadding);
  ctx.lineTo(crop.x + crop.width + mPadding, crop.y + crop.height + mPadding - length);
  ctx.stroke();
}

export function drawOverlay(canvas: HTMLCanvasElement, crop: CropSettings) {
  const ctx = get(context2D);
  const darken = get(darkenLevel);
  if (!ctx) {
    return;
  }

  ctx.fillStyle = `rgba(0, 0, 0, ${darken})`;

  ctx.fillRect(mPadding, mPadding, canvas.width - 2 * mPadding, crop.y);
  ctx.fillRect(mPadding, crop.y + mPadding, crop.x, crop.height);
  ctx.fillRect(
    crop.x + crop.width + mPadding,
    crop.y + mPadding,
    canvas.width - crop.x - crop.width - 2 * mPadding,
    crop.height,
  );
  ctx.fillRect(
    mPadding,
    crop.y + crop.height + mPadding,
    canvas.width - 2 * mPadding,
    canvas.height - crop.y - crop.height - 2 * mPadding,
  );
}
