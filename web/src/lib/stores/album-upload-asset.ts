import { writable } from 'svelte/store';

export const albumUploadAsset = writable<Array<string>>([]);
