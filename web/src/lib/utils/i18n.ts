import { langs } from '$lib/constants';
import { locale, t, waitLocale } from 'svelte-i18n';
import { get, type Unsubscriber } from 'svelte/store';

export async function getFormatter() {
  let unsubscribe: Unsubscriber | undefined;
  await new Promise((resolve) => {
    unsubscribe = locale.subscribe((value) => value && resolve(value));
  });
  unsubscribe?.();

  await waitLocale();
  return get(t);
}

// https://github.com/kaisermann/svelte-i18n/blob/780932a3e1270d521d348aac8ba03be9df309f04/src/runtime/stores/locale.ts#L11
function getSubLocales(refLocale: string) {
  return refLocale
    .split('-')
    .map((_, i, arr) => arr.slice(0, i + 1).join('-'))
    .reverse();
}

export function getClosestAvailableLocale(locales: readonly string[], allLocales: readonly string[]) {
  const allLocalesSet = new Set(allLocales);
  return locales.find((locale) => getSubLocales(locale).some((subLocale) => allLocalesSet.has(subLocale)));
}

export const langCodes = langs.map((lang) => lang.code);

export function getPreferredLocale() {
  return getClosestAvailableLocale(navigator.languages, langCodes);
}
