import { browser } from '$app/environment'
import { init, register } from 'svelte-i18n'

const defaultLocale = 'en'

register('en', () => import('./locales/en-EN.json'))
register('de', () => import('./locales/de-DE.json'))
register('fr', () => import('./locales/fr.json'))

init({
	fallbackLocale: defaultLocale,
	initialLocale: browser ? window.navigator.language : defaultLocale,
})