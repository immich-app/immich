import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { Route } from '$lib/route';
import { getFormatter } from '$lib/utils/i18n';
import { init } from '$lib/utils/server';
import { redirect } from '@sveltejs/kit';
import { loadUser } from '../lib/utils/auth';
import type { PageLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  try {
    await init(fetch);

    const authenticated = await loadUser();
    if (authenticated) {
      redirect(307, Route.userSettings());
    }

    if (serverConfigManager.value.isInitialized) {
      redirect(307, Route.login());
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (redirectError: any) {
    if (redirectError?.status === 307) {
      throw redirectError;
    }
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('welcome') + ' 🎉',
      description: 'Web Interface',
    },
  };
}) satisfies PageLoad;
