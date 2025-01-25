import type { ZoomImageWheelState } from '@zoom-image/core';
import { writable } from 'svelte/store';

export const photoZoomState = writable<ZoomImageWheelState>();
export const zoomed = writable<boolean>();
export const rotated = writable<number>();
