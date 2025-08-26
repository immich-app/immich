const modules = import.meta.glob('$i18n/*.json');

export const availableLocales = Object.keys(modules)
  .map((path) => path.match(/\/(\w+)\.json$/)?.[1])
  .filter((code): code is string => Boolean(code));

export function convertBCP47(code: string) {
  return code.replace('_', '-');
}

export const langCodes = availableLocales.map((code) => convertBCP47(code));

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

export function getPreferredLocale() {
  return getClosestAvailableLocale(navigator.languages, langCodes);
}

