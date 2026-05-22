import { writable } from 'svelte/store';

const selectedIdStore = writable<string | undefined>(undefined);
const optionClickCallbackStore = writable<(() => void) | undefined>(undefined);

export { optionClickCallbackStore, selectedIdStore };
