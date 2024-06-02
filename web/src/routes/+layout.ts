import { defaults } from '@immich/sdk';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment'
import '$lib/i18n' // Import to initialize. Important :)
import { locale, waitLocale } from 'svelte-i18n'

export const ssr = false;
export const csr = true;

export const load = (({ fetch }) => {
  // set event.fetch on the fetch-client used by @immich/sdk
  // https://kit.svelte.dev/docs/load#making-fetch-requests
  // https://github.com/oazapfts/oazapfts/blob/main/README.md#fetch-options
  defaults.fetch = fetch;
  if (browser) {
		locale.set(window.navigator.language)
	}
  else {
    locale.set('en-EN')
  }
  return {
    meta: {
      title: 'Immich',
    },
  };
}) satisfies LayoutLoad;
