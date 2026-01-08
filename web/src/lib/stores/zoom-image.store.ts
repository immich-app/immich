import type { ZoomImageWheelState } from '@zoom-image/core';
import { writable } from 'svelte/store';

export const photoZoomState = writable<ZoomImageWheelState>({
  currentRotation: 0,
  currentZoom: 1,
  enable: true,
  currentPositionX: 0,
  currentPositionY: 0,
});

export const resetZoomState = () => {
  photoZoomState.set({
    currentRotation: 0,
    currentZoom: 1,
    enable: true,
    currentPositionX: 0,
    currentPositionY: 0,
  });
};
