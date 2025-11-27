import { writable } from 'svelte/store';

export const darkenLevel = writable(0.65);
export const isResizingOrDragging = writable(false);
export const animationFrame = writable<ReturnType<typeof requestAnimationFrame> | null>(null);
export const canvasCursor = writable('default');
export const dragOffset = writable({ x: 0, y: 0 });
export const resizeSide = writable('');
export const imgElement = writable<HTMLImageElement | null>(null);
export const cropAreaEl = writable<HTMLElement | null>(null);
export const isDragging = writable<boolean>(false);

export const overlayEl = writable<HTMLElement | null>(null);
export const cropFrame = writable<HTMLElement | null>(null);

export function resetCropStore() {
  darkenLevel.set(0.65);
  isResizingOrDragging.set(false);
  animationFrame.set(null);
  canvasCursor.set('default');
  dragOffset.set({ x: 0, y: 0 });
  resizeSide.set('');
  imgElement.set(null);
  cropAreaEl.set(null);
  isDragging.set(false);
  overlayEl.set(null);
}
