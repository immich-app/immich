import { browser } from '$app/environment';
import { defaultLang, langs } from '$lib/constants';
import { lang } from '$lib/stores/preferences.store';
import { defaults } from '@immich/sdk';
import { init, register } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';

export const load = (async () => {
  if (!browser) {
    defaults.baseUrl = 'http://localhost:3001/api';
  }

  for (const { code, loader } of langs) {
    register(code, loader);
  }

  const preferenceLang = get(lang);

  await init({ fallbackLocale: preferenceLang === 'dev' ? 'dev' : defaultLang.code, initialLocale: preferenceLang });

  return {
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
