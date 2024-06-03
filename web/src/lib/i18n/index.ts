import { browser } from '$app/environment';
import en_US from '$lib/i18n/locales/en-US.json';
import { init, register } from 'svelte-i18n';

const defaultLocale = 'en-US';
register('en-US', () => Promise.resolve(en_US));

// register('en', () => import('./locales/en-EN.json'))
// register('de', () => import('./locales/de-DE.json'))
// register('fr', () => import('./locales/fr.json'))

void init({
  fallbackLocale: defaultLocale,
  initialLocale: browser ? window.navigator.language : defaultLocale,
});
