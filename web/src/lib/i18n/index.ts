import { browser } from '$app/environment'
import { init, register } from 'svelte-i18n'

const defaultLocale = 'en-EN'
const localeModules = import.meta.glob("./locales/*.json");

for (const modulePath in localeModules) {
	let code = modulePath.substring(modulePath.lastIndexOf('/') + 1, modulePath.lastIndexOf('.'))
	register(code, () => import(/* @vite-ignore */ modulePath))
}

// register('en', () => import('./locales/en-EN.json'))
// register('de', () => import('./locales/de-DE.json'))
// register('fr', () => import('./locales/fr.json'))

init({
	fallbackLocale: defaultLocale,
	initialLocale: browser ? window.navigator.language : defaultLocale,
})