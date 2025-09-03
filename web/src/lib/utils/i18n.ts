import { isRtlLang } from '$lib/components/i18n/langs-rtl';
import { nonIntlLang } from '$lib/constants';
import { availableLocales } from '$lib/utils/i18n-meta';
import { locale, t, waitLocale } from 'svelte-i18n';
import { get, type Unsubscriber } from 'svelte/store';

import type { Lang } from '$lib/constants';

export async function getFormatter() {
  let unsubscribe: Unsubscriber | undefined;
  await new Promise((resolve) => {
    unsubscribe = locale.subscribe((value) => value && resolve(value));
  });
  unsubscribe?.();

  await waitLocale();
  return get(t);
}

function getDisplayName(code: string) {
  const lang = nonIntlLang.find((lang) => lang.code === code);
  if (lang) {
    return lang.name;
  }
  const name = new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
  return capitalize(name);
}

const translatedLangs: Lang[] = availableLocales.map((code) => ({
  name: getDisplayName(convertBCP47(code)),
  code,
  loader: () => import(`$i18n/${code}.json`),
  rtl: isRtlLang(code),
}));

export const langs: Lang[] = [
  ...translatedLangs.sort((a, b) => a.code.localeCompare(b.code)),
  { name: 'Development (keys only)', code: 'dev', loader: () => Promise.resolve({ default: {} }) },
];

function convertBCP47(code: string) {
  return code.replace('_', '-');
}

function capitalize(string: string) {
  return string
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
