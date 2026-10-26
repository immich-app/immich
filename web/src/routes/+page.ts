import { authManager } from '#lib/managers/auth-manager.svelte.js';
import { readPreloadedQuery } from '#lib/queries/client.js';
import { getServerConfigQuery } from '#lib/queries/server-info.query.js';
import { Route } from '#lib/route.js';
import { init } from '#lib/utils/client.js';
import { getFormatter } from '#lib/utils/i18n.js';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  try {
    await init(fetch);

    const serverConfig = readPreloadedQuery(getServerConfigQuery());
    if (serverConfig.maintenanceMode) {
      redirect(307, Route.maintenanceMode());
    }

    await authManager.load();
    if (authManager.authenticated) {
      redirect(307, Route.photos());
    }

    if (serverConfig.isInitialized) {
      // Redirect to login page if there exists an admin account (i.e. server is initialized)
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
    },
  };
}) satisfies PageLoad;
