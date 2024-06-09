import { defaultLang, langs } from '$lib/constants';
import { lang } from '$lib/stores/preferences.store';
import { defaults } from '@immich/sdk';
import { init, register } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  // set event.fetch on the fetch-client used by @immich/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  defaults.fetch = fetch;

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
