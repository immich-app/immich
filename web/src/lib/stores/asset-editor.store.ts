import { writable } from 'svelte/store';

//-----other
export const lastChosenLocation = writable<{ lng: number; lat: number } | null>(null);
