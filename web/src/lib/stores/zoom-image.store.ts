import { writable } from 'svelte/store';
import type { ZoomImageWheelState } from '@zoom-image/core';

export const photoZoomState = writable<ZoomImageWheelState>();
