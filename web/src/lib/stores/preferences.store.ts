import { browser } from '$app/environment';
import { persisted } from 'svelte-local-storage-store';

const initialTheme =
	browser && !window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';

// The 'color-theme' key is also used by app.html to prevent FOUC on page load.
export const colorTheme = persisted<'dark' | 'light'>('color-theme', initialTheme, {
	serializer: {
		parse: (text) => (text === 'light' ? text : 'dark'),
		stringify: (obj) => obj
	}
});

// Locale to use for formatting dates, numbers, etc.
export const locale = persisted<string | undefined>('locale', undefined, {
	serializer: {
		parse: (text) => text,
		stringify: (obj) => obj ?? ''
	}
});

export interface MapSettings {
	allowDarkMode: boolean;
	onlyFavorites: boolean;
	relativeDate: string;
	dateAfter: string;
	dateBefore: string;
}

export const mapSettings = persisted<MapSettings>('map-settings', {
	allowDarkMode: true,
	onlyFavorites: false,
	relativeDate: '',
	dateAfter: '',
	dateBefore: ''
});
