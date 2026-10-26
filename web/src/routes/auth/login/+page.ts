import { authManager } from '#lib/managers/auth-manager.svelte.js';
import { readPreloadedQuery } from '#lib/queries/client.js';
import { getServerConfigQuery } from '#lib/queries/server-info.query.js';
import { Route } from '#lib/route.js';
import { getFormatter } from '#lib/utils/i18n.js';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ parent, url }) => {
  await parent();

  const continueUrl = Route.continue(url.searchParams.get('continue'), Route.photos());

  if (authManager.authenticated) {
    redirect(307, continueUrl);
  }

  if (!readPreloadedQuery(getServerConfigQuery()).isInitialized) {
    // Admin not registered
    redirect(307, Route.register());
  }

  const $t = await getFormatter();
  return {
    meta: {
      title: $t('login'),
    },
    continueUrl,
  };
}) satisfies PageLoad;
