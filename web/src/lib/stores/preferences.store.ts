import { browser } from '$app/environment';
import { persisted } from 'svelte-local-storage-store';

export type Preferences = {
	theme: 'dark' | 'light';
};

export const preferences = persisted<Preferences>('preferences', {
	theme: browser && !window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark'
});
