import { writable } from 'svelte/store';

export const cropSettings = writable<CropSettings>({ x: 0, y: 0, width: 100, height: 100 });
export const cropImageSize = writable([1000, 1000]);
export const cropImageScale = writable(1);
export const cropAspectRatio = writable<CropAspectRatio>('free');
export const cropSettingsChanged = writable<boolean>(false);

export type CropAspectRatio = '1:1' | '16:9' | '3:2' | '7:5' | 'free' | 'reset';

export type CropSettings = {
  x: number;
  y: number;
  width: number;
  height: number;
};
