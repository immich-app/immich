import { writable } from 'svelte/store';

export type TiePreference = 'default' | 'external' | 'internal';

export const duplicateTiePreference = writable<TiePreference>('default');
