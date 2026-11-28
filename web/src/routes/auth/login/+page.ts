import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { readPreloadedQuery } from '#lib/queries/client.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { Route } from '#lib/route.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ parent, url }) => {
  await parent();

  const continueUrl = Route.continue(url.searchParams.get('continue'), Route.photos());
  const isOAuthCallback = url.searchParams.has('code') || url.searchParams.has('error');
  const isOAuthAutoLaunch = url.searchParams.has('autoLaunch');
  if (authManager.authenticated && !isOAuthCallback && !isOAuthAutoLaunch) {
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
