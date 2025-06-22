import { writable } from 'svelte/store';

export const photoViewerImgElement = writable<HTMLImageElement | null>(null);
export const isSelectingAllAssets = writable(false);
