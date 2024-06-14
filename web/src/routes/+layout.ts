import { defaultLang, langs } from '$lib/constants';
import { lang } from '$lib/stores/preferences.store';
import { initSDK } from '$lib/utils/server';
import { init, register } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  let hasError = false;
  try {
    await initSDK(fetch);
  } catch {
    // error pages use page layouts, so can't throw error - catch it and display error message in layout.
    hasError = true;
  }

  for (const { code, loader } of langs) {
    register(code, loader);
  }

  const preferenceLang = get(lang);

  await init({ fallbackLocale: preferenceLang === 'dev' ? 'dev' : defaultLang.code, initialLocale: preferenceLang });

  return {
    hasError,
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
