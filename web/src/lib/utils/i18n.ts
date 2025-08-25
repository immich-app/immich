import { LANGUAGES_LIST_ISO_639_1 } from '$lib/components/i18n/lang-iso-639-1';
import { LANGUAGES_LIST_ISO_639_3 } from '$lib/components/i18n/lang-iso-639-3';
import { LANGUAGES_LIST_WEBLATE_SPECIAL } from '$lib/components/i18n/lang-weblate-special';
import { isRtlLang } from '$lib/components/i18n/langs-rtl';
import { locale, t, waitLocale } from 'svelte-i18n';
import { get, type Unsubscriber } from 'svelte/store';

interface Lang {
  name: string;
  code: string;
  loader: () => Promise<{ default: object }>;
  rtl?: boolean;
  weblateCode?: string;
}

const allLangs = {
  ...LANGUAGES_LIST_ISO_639_1,
  ...LANGUAGES_LIST_ISO_639_3,
  ...LANGUAGES_LIST_WEBLATE_SPECIAL,
} as Record<string, { name: string; nativeName: string; weblateCode?: string }>;

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

const modules = import.meta.glob('$i18n/*.json');
const availableCodes = Object.keys(modules)
  .map((path) => path.match(/\/(\w+)\.json$/)?.[1])
  .filter((code): code is string => Boolean(code));

const webplateLangs: Lang[] = availableCodes.map((code) => ({
  name: allLangs[code].nativeName || code,
  code,
  loader: () => import(`$i18n/${code}.json`).catch(() => import(`$i18n/en.json`)),
  rtl: isRtlLang(code),
}));

export const defaultLang: Lang = { name: 'English', code: 'en', loader: () => import('$i18n/en.json') };

export const langs: Lang[] = [
  ...webplateLangs,
  { name: 'Development (keys only)', code: 'dev', loader: () => Promise.resolve({ default: {} }) },
];

export const langCodes = langs.map((lang) => lang.code);

export function getPreferredLocale() {
  return getClosestAvailableLocale(navigator.languages, langCodes);
}
