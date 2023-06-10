import type { LayoutLoad } from './$types';
import { loadLocaleAsync } from '$lib/i18n/i18n-util.async';
import { setLocale } from '$lib/i18n/i18n-svelte';
import type { Locales } from '$lib/i18n/i18n-types';
import { language } from '$lib/stores/preferences.store';
import { get } from 'svelte/store'

export const load = (async (event) => {
  const lang = get(language) as Locales
  // Load it
  await loadLocaleAsync(lang);
  // Set it
  setLocale(lang);

  return event.data;
}) satisfies LayoutLoad;