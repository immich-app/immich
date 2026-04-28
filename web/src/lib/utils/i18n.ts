import type { Lang } from '$lib/constants';
import { locale, t, waitLocale } from 'svelte-i18n';
import { get, type Unsubscriber } from 'svelte/store';

export const getFormatter = async () => {
  let unsubscribe: Unsubscriber | undefined;
  await new Promise((resolve) => {
    unsubscribe = locale.subscribe((value) => value && resolve(value));
  });
  unsubscribe?.();

  await waitLocale();
  return get(t);
};

const modules = import.meta.glob('$i18n/*.json');

const fileCodes = Object.keys(modules)
  .map((path) => path.match(/\/(\w+)\.json$/)?.[1])
  .filter(Boolean) as string[];

const convertBCP47 = (code: string) => code.replace('_', '-');

export const langCodes = fileCodes.map((code) => convertBCP47(code));

// https://github.com/kaisermann/svelte-i18n/blob/780932a3e1270d521d348aac8ba03be9df309f04/src/runtime/stores/locale.ts#L11
const getSubLocales = (locale: string) => {
  return locale
    .split('-')
    .map((_, i, arr) => arr.slice(0, i + 1).join('-'))
    .reverse();
};

export const getClosestAvailableLocale = (locales: readonly string[], allLocales: readonly string[]) => {
  const allLocalesSet = new Set(allLocales);
  return locales.find((locale) => getSubLocales(locale).some((subLocale) => allLocalesSet.has(subLocale)));
};

export const getPreferredLocale = () => getClosestAvailableLocale(navigator.languages, langCodes);

const rtlCodes = new Set([
  'ae',
  'aeb',
  'aii',
  'ajp',
  'apc',
  'apd',
  'ar',
  'ar_BH',
  'ar_DZ',
  'ar_EG',
  'ar_KW',
  'ar_LY',
  'ar_MA',
  'ar_SA',
  'ar_YE',
  'ara',
  'arc',
  'arq',
  'ars',
  'arz',
  'ave',
  'bal',
  'bcc',
  'bgn',
  'bqi',
  'ckb',
  'ckb_IR',
  'dv',
  'egy',
  'fa',
  'fa_AF',
  'fas',
  'glk',
  'ha',
  'he',
  'heb',
  'khw',
  'kmr',
  'ks',
  'ku',
  'lrc',
  'luz',
  'ms_Arab',
  'mzn',
  'nqo',
  'pa_PK',
  'pal',
  'per',
  'phn',
  'pnb',
  'prs',
  'ps',
  'rhg',
  'sam',
  'sd',
  'sdh',
  'skr',
  'syc',
  'syr',
  'ug',
  'ur',
  'ur_IN',
  'urd',
  'yi',
]);

const capitalize = (string: string) =>
  string
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const nonIntlNames: Record<string, string> = {
  mfa: 'Malay (Pattani)',
  bi: 'Bislama',
};

const getLanguageName = (code: string) =>
  nonIntlNames[code] ?? capitalize(new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code);

export const langs: Lang[] = [
  ...fileCodes
    .map((code) => ({
      name: getLanguageName(convertBCP47(code)),
      code,
      loader: () => import(`$i18n/${code}.json`),
      rtl: rtlCodes.has(code),
    }))
    .sort((a, b) => a.code.localeCompare(b.code)),
  { name: 'Development (keys only)', code: 'dev', loader: () => Promise.resolve({ default: {} }) },
];
