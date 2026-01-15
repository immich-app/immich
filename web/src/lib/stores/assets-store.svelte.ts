import { writable } from 'svelte/store';

export const photoViewerImgElement = writable<HTMLImageElement>();
export const isSelectingAllAssets = writable(false);
