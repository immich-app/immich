import { writable } from 'svelte/store';

export const photoViewerImgElement = writable<HTMLImageElement | null | undefined>(null);
export const isSelectingAllAssets = writable(false);
