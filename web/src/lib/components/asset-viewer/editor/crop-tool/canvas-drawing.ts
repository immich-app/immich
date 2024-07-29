import type { CropSettings } from '$lib/stores/asset-editor.store';
import { get } from 'svelte/store';
import { context2D, darkenLevel, imgElement, isResizingOrDragging } from './crop-store';

export function draw(canvas: HTMLCanvasElement | null, crop: CropSettings) {
  const ctx = get(context2D);
  const img = get(imgElement);
  if (!ctx || !canvas || !img) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
  ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

  if (get(isResizingOrDragging)) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    const thirdWidth = crop.width / 3;
    ctx.beginPath();
    ctx.moveTo(crop.x + thirdWidth, crop.y);
    ctx.lineTo(crop.x + thirdWidth, crop.y + crop.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(crop.x + 2 * thirdWidth, crop.y);
    ctx.lineTo(crop.x + 2 * thirdWidth, crop.y + crop.height);
    ctx.stroke();

    const thirdHeight = crop.height / 3;
    ctx.beginPath();
    ctx.moveTo(crop.x, crop.y + thirdHeight);
    ctx.lineTo(crop.x + crop.width, crop.y + thirdHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(crop.x, crop.y + 2 * thirdHeight);
    ctx.lineTo(crop.x + crop.width, crop.y + 2 * thirdHeight);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
  const radius = 5;
  ctx.fillStyle = 'white';

  ctx.beginPath();
  ctx.arc(crop.x, crop.y, radius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(crop.x + crop.width, crop.y, radius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(crop.x, crop.y + crop.height, radius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(crop.x + crop.width, crop.y + crop.height, radius, 0, 2 * Math.PI);
  ctx.fill();
}

export function drawOverlay(canvas: HTMLCanvasElement, crop: CropSettings) {
  const ctx = get(context2D);
  const darken = get(darkenLevel);
  if (!ctx) {
    return;
  }

  ctx.fillStyle = `rgba(0, 0, 0, ${darken})`;

  ctx.fillRect(0, 0, canvas.width, crop.y);
  ctx.fillRect(0, crop.y, crop.x, crop.height);
  ctx.fillRect(crop.x + crop.width, crop.y, canvas.width - crop.x - crop.width, crop.height);
  ctx.fillRect(0, crop.y + crop.height, canvas.width, canvas.height - crop.y - crop.height);
}
