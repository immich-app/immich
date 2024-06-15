import { defaultLang, langs } from '$lib/constants';
import { lang } from '$lib/stores/preferences.store';
import { loadConfig } from '$lib/stores/server-config.store';
import { initSDK } from '$lib/utils/server';
import { init, register } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const csr = true;

const initLanguage = async () => {
  for (const { code, loader } of langs) {
    register(code, loader);
  }
  const preferenceLang = get(lang);
  await init({ fallbackLocale: preferenceLang === 'dev' ? 'dev' : defaultLang.code, initialLocale: preferenceLang });
};

export const load = (async ({ fetch }) => {
  let error = null;
  try {
    await initLanguage();
    initSDK(fetch);
    await loadConfig();
  } catch (error_) {
    error = error_;
  }

  return {
    error,
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
